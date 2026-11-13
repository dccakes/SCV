# Observability (OpenTelemetry + PostHog)

SCV sends distributed traces, structured logs, errors, and AI (Etta) usage to
PostHog. Traces and logs use standard OpenTelemetry (OTLP over HTTP), so any
OTLP backend can be swapped in or added. Errors use PostHog error tracking.
Etta's model calls show up in PostHog AI observability.

Everything is **optional**. With no PostHog token the app runs unchanged:
spans stay local, and logs still go to the console.

## What is captured

| Signal | Server (Node.js) | Browser |
| --- | --- | --- |
| Traces | Next.js routes and renders, `fetch`, Prisma queries, one span per tRPC procedure, AI SDK (Etta) generations and tool calls | Document load, every `fetch` (including tRPC) |
| Logs | `logger` from `~/lib/observability/logger` | `posthog.logger` from `posthog-js` |
| Errors | `onRequestError` (renders, route handlers, server actions), tRPC 5xx, Etta route 5xx, mid-stream failures, and unexpected tool errors, Telegram background handler failures | Unhandled errors and rejections, React error boundaries, fetch 5xx and network failures |
| AI | Etta generations as `$ai_generation` events: prompts, outputs, tool calls and results, model, tokens, cost, latency; per signed-in user, grouped by conversation, linked to the replay | |

Every server event, exception, and AI span carries `environment`
(`VERCEL_ENV`, else `NODE_ENV`) and `app_version` (the deployed commit); the
browser registers the same two keys as super properties. Preview and local
traffic share the project with production, so filter on `environment`.

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
| `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID` | build | Optional. Both set: upload source maps to error tracking on `next build`. Key scopes: `error tracking write`, `organization read`. |

Vercel's own tracing integrations and log drains keep working: the PostHog
exporter is added alongside `@vercel/otel`'s defaults, not instead of them.

## AI observability (Etta)

Etta runs on Vercel AI SDK 7. In v7 the `ai` package emits no spans on its own:
`registerAiTelemetry()` (`ai-telemetry.ts`, called from `instrumentation.ts` in
the Node runtime) registers the `@ai-sdk/otel` integration once, after which
every AI SDK call is traced. Spans go to two places:

- PostHog distributed tracing, as part of the request trace (like every span).
- PostHog AI observability, through `PostHogSpanProcessor` from `@posthog/ai/otel`
  in `node-otel.ts`. It only forwards AI spans (`gen_ai.*`, `ai.*`) to
  `<host>/i/v0/ai/otel`, where PostHog turns them into `$ai_generation` events.
  The plain tracing endpoint does not do that conversion.

Prompts, outputs, tool arguments, and tool results are recorded (the v7
default), so traces can be read, searched, and evaluated in PostHog.

Each call passes a `runtimeContext` that `enrichAiSpan` maps onto the attributes
PostHog reads. v7 drops runtime context from telemetry unless the call lists it
in `telemetry.includeRuntimeContext` (`ETTA_TELEMETRY_CONTEXT`).

| Context field | PostHog attribute | Source |
| --- | --- | --- |
| `distinctId` | `posthog.distinct_id` | Signed-in user id. Omitted for anonymous guests, so no person is attached. |
| `sessionId` | `$ai_session_id` | Conversation: `web:<useChat id>` or `telegram:<identity id>`. Groups a chat's calls into one AI session. |
| `browserSessionId` | `$session_id` | posthog-js `X-POSTHOG-SESSION-ID` header; links the trace to the session replay. |
| `properties` | same keys | `wedding_id`, `persona`, `model`, `toolset_mode`, `environment`, `app_version`. |

Trace names come from the root span, which is named after the function id
(`invoke_agent etta.couple`, `etta.guest`, `etta.couple-bot`).

Failures surface in error tracking as well as in the trace: `onError` reports
mid-stream failures, and `onToolExecutionEnd` reports tools that threw, except
expected 4xx outcomes such as a `FORBIDDEN` permission check.

When `@vercel/otel` ends a sampled root span it flushes every span processor
through `waitUntil`, so AI spans are not lost when a serverless function
freezes.

## Source maps

Without uploaded source maps, browser stack traces in PostHog error tracking
are minified. `next.config.js` wraps the config with `withPostHogConfig` from
`@posthog/nextjs-config` only when both `POSTHOG_PERSONAL_API_KEY` and
`POSTHOG_PROJECT_ID` are set (see `src/posthog-sourcemaps.js`). Maps are
uploaded as release `scv` at `VERCEL_GIT_COMMIT_SHA`, then deleted from the
build output so they are never served. Set both only on the environment whose
builds you want symbolicated (usually Vercel Production). With a bad key the
build fails rather than shipping silently unmapped.

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
- Etta AI spans **do** record prompts, completions, tool arguments, and tool
  results, which include guest names, dietary answers, and other wedding data.
  They go to PostHog (US cloud) like session replays do. To stop that for a
  call, set `telemetry.recordInputs` / `recordOutputs` to `false` in
  `agent.ts`; to strip content for every call, pass `privacyMode: true` to
  `PostHogSpanProcessor` in `node-otel.ts`.
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
| `src/server/infrastructure/observability/request-context.ts` | Serverless `waitUntil` lookup shared by log flushing and posthog-node |
| `src/server/infrastructure/observability/ai-telemetry.ts` | Registers `@ai-sdk/otel`; maps call context to PostHog AI attributes |
| `src/lib/etta/agent.ts` | Etta runtime context (user, conversation, replay, wedding); stream and tool error capture |
| `src/posthog-sourcemaps.js` | Opt-in source map upload config for `withPostHogConfig` |
| `src/lib/observability/logger.ts` | Server/Edge OTel logger |
| `instrumentation-client.ts` | posthog-js init (errors, logs, tracing headers); lazy-loads browser tracing |
| `src/lib/observability/browser-tracing.ts` | Browser OTel tracer, fetch + document load, fetch error reporting |

### Serverless flushing

On Vercel, `@vercel/otel` flushes span processors through `waitUntil`, but
only for sampled root spans, and it never flushes log processors.
`flushLogsPerRequest` therefore hands each request's `waitUntil` a flush
whenever a log record is emitted inside it, independent of trace sampling.
All requests on an instance share one serialized drain that repeats until no
records arrived during the last export: the SDK's `forceFlush()` returns
immediately while another flush is exporting, so overlapping per-request
flushes would otherwise release a request with its logs still buffered. Outside a
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
6. Send Etta a message and check AI observability: a trace named
   `invoke_agent etta.couple` with the prompt, reply, tool calls, cost, and
   your user, in a session keyed `web:<chat id>`.

posthog-js drops events from headless or automated browsers (bot filtering),
so browser errors won't appear from a default Playwright run.
