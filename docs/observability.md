# Observability (OpenTelemetry + PostHog)

SCV sends distributed traces, structured logs, and errors to PostHog. Traces
and logs use standard OpenTelemetry (OTLP over HTTP), so any OTLP backend can
be swapped in or added. Errors use PostHog error tracking.

Everything is **optional**. With no PostHog token the app runs unchanged:
spans stay local, and logs still go to the console.

## What is captured

| Signal | Server (Node.js) | Browser |
| --- | --- | --- |
| Traces | Next.js routes and renders, `fetch`, Prisma queries, one span per tRPC procedure, AI SDK (Etta) generations and tool calls | Document load, every `fetch` (including tRPC) |
| Logs | `logger` from `~/lib/observability/logger` | `posthog.logger` from `posthog-js` |
| Errors | `onRequestError` (renders, route handlers, server actions) and tRPC 5xx | Unhandled errors and rejections, React error boundaries, fetch 5xx and network failures |

### One trace, browser to database

1. Next.js renders `<meta name="traceparent">` (`experimental.clientTraceMetadata`),
   so the browser's `documentLoad` span is a child of the server render.
2. Browser `fetch` spans inject W3C `traceparent` into same-origin requests, so
   the tRPC procedure and Prisma spans nest under the click that caused them.
3. posthog-js `tracing_headers` adds `X-POSTHOG-DISTINCT-ID` and
   `X-POSTHOG-SESSION-ID`. Server spans and server exceptions use them to link
   back to the session replay (`sessionId` span attribute, `$session_id` on
   exceptions). Any client can set these headers, so for the person
   (`posthogDistinctId`) tRPC spans and server exceptions prefer the signed-in
   user id, and only a signed-in user id may create or update a person profile;
   header ids from anonymous guests link to their session but never touch
   profiles. The request's root span is the exception: `@vercel/otel` sets it
   from the raw header before auth runs, so treat it as a hint.
4. Logs emitted during a request carry its `trace_id`/`span_id`; exceptions
   carry `trace_id`/`span_id` properties.
5. React error boundaries send Next's `digest`, which matches `error.digest` on
   the server's `Unhandled request error` log and exception.

## Configuration

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | build + runtime | Enables browser analytics, errors, logs, and traces. |
| `POSTHOG_KEY` | runtime | Server token; falls back to the public token. Must be a `phc_` project token. |
| `POSTHOG_HOST` | runtime | Ingestion host for all server telemetry: events, exceptions, traces, and logs. Default `https://us.i.posthog.com`. `NEXT_PUBLIC_POSTHOG_HOST` (the UI host) is never used for ingestion. |
| `NEXT_PUBLIC_OTEL_SAMPLE_RATE` | build | Browser root-trace sample rate, 0..1. Default 1. |
| `OTEL_TRACES_SAMPLER`, `OTEL_TRACES_SAMPLER_ARG` | runtime | Server sampling (standard OTel). Default: all requests. |
| `OTEL_EXPORTER_OTLP_*` | runtime | Optional extra OTLP trace destination, picked up by `@vercel/otel`. |

Vercel's own tracing integrations and log drains keep working: the PostHog
exporter is added alongside `@vercel/otel`'s defaults, not instead of them.

## Using the logger

```ts
import { logger } from '~/lib/observability/logger'

const log = logger.child({ component: 'rsvp' })
log.info('RSVP submitted', { wedding_id: weddingId, guest_count: guests.length })
log.error('RSVP email failed', { wedding_id: weddingId }, error)
```

- Use `snake_case` attribute keys and stable messages; put variable data in
  attributes, not the message.
- Pass errors as the third argument. They become `exception.type`,
  `exception.message`, and `exception.stacktrace`.
- Each record also prints one JSON line to the console (Vercel runtime logs).
- Logging is not error reporting. For a failure someone should look at, also
  call `captureServerException` from
  `~/server/infrastructure/observability/capture-exception`.

In client components use `posthog.logger` directly (`info`, `warn`, `error`,
with an attributes object). `instrumentation-client.ts` sets its service name,
environment, and version, and posthog-js attaches the session and person to
each record. Records go to PostHog only, not the browser console. Console
autocapture is deliberately **off**: third party libraries log things we don't
control.

## Privacy

- Query strings, fragments, and URL credentials are stripped from span names
  and URL attributes, on the server (before any exporter, including Vercel's)
  and in the browser. tRPC GET requests carry procedure input in `?input=`,
  invite links carry tokens, and `@vercel/otel` names fetch spans
  `fetch GET <full url>`.
- Secrets in URL paths are masked: the Telegram bot token
  (`/bot<id>:<secret>/`) becomes `/bot[REDACTED]/`. Add a pattern to
  `sanitizeTelemetryText` in `node-otel.ts` for any new client that puts
  credentials in a path.
- Etta AI spans record model, timing, token usage, and tool names, but not
  prompts or completions (`recordInputs`/`recordOutputs` are off).
- Prisma spans include SQL text with parameters as placeholders, not values.
- Path segments are kept as-is (for example `/join/<token>`); PostHog pageviews
  already record the same URLs.

## Implementation map

| File | Role |
| --- | --- |
| `src/instrumentation.ts` | `registerOTel` per runtime; `onRequestError` logging and capture |
| `src/server/infrastructure/observability/node-otel.ts` | Node config: PostHog OTLP exporters, Prisma, span name and URL redaction, per-request log flushing |
| `src/server/infrastructure/observability/trpc-tracing.ts` | Per-procedure tRPC spans |
| `src/server/infrastructure/observability/capture-exception.ts` | Server exceptions to PostHog |
| `src/lib/observability/logger.ts` | Server/Edge OTel logger |
| `instrumentation-client.ts` | posthog-js init (errors, logs, tracing headers); lazy-loads browser tracing |
| `src/lib/observability/browser-tracing.ts` | Browser OTel tracer, fetch + document load, fetch error reporting |

### Serverless flushing

On Vercel, `@vercel/otel` flushes span processors through `waitUntil`, but
only for sampled root spans, and it never flushes log processors.
`flushLogsPerRequest` therefore registers its own `waitUntil` flush whenever a
log record is emitted inside a request, independent of trace sampling, so logs
from sampled-out requests are exported before the function freezes. Outside a
request context the batch processor's timer exports as usual. Server
exceptions are flushed explicitly before returning.

## Verifying locally

1. Run a local OTLP sink, or point `POSTHOG_HOST` at a dev PostHog project.
2. Start the app with `POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` set.
3. Load a dynamic page and confirm `<meta name="traceparent">` is present.
4. Trigger a tRPC call and check PostHog Tracing: the browser `GET` span, the
   server route span, the `trpc <procedure>` span, and Prisma spans should share
   one trace.
5. Check PostHog Logs for records carrying that trace id.

posthog-js drops events from headless or automated browsers (bot filtering),
so browser errors won't appear from a default Playwright run.
