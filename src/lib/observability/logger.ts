/**
 * Structured server logger backed by the OpenTelemetry Logs API.
 *
 * Every record is emitted twice:
 * - to the global OTel LoggerProvider (registered in `src/instrumentation.ts`
 *   and exported to PostHog Logs). The SDK stamps the active trace/span ids,
 *   so logs line up with the request's distributed trace.
 * - to the console as a single JSON line, so Vercel runtime logs and local dev
 *   output keep working when no exporter is configured.
 *
 * Safe in both the Node.js and Edge runtimes: only API packages are imported.
 * For browser code use `~/lib/observability/browser-logger` instead.
 */

import { trace } from '@opentelemetry/api'
import { type AnyValue, type AnyValueMap, logs, SeverityNumber } from '@opentelemetry/api-logs'

import { SERVICE_NAME } from '~/lib/observability/config'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type LogAttributes = Readonly<Record<string, unknown>>

export interface Logger {
  debug(message: string, attributes?: LogAttributes): void
  info(message: string, attributes?: LogAttributes): void
  warn(message: string, attributes?: LogAttributes, error?: unknown): void
  error(message: string, attributes?: LogAttributes, error?: unknown): void
  /** Logger whose records always carry `bindings` (e.g. `{ component: 'etta' }`). */
  child(bindings: LogAttributes): Logger
}

const SEVERITY: Readonly<Record<LogLevel, SeverityNumber>> = {
  debug: SeverityNumber.DEBUG,
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
}

const MAX_DEPTH = 4

function toAnyValue(value: unknown, depth: number): AnyValue | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Date) return value.toISOString()
  if (value instanceof Error) return { name: value.name, message: value.message }
  if (depth >= MAX_DEPTH) return String(value)
  if (Array.isArray(value)) {
    return value.map((item) => toAnyValue(item, depth + 1) ?? null)
  }
  if (typeof value === 'object') return toAnyValueMap(value as Record<string, unknown>, depth + 1)
  return String(value)
}

function toAnyValueMap(attributes: Readonly<Record<string, unknown>>, depth = 0): AnyValueMap {
  const result: AnyValueMap = {}
  for (const [key, raw] of Object.entries(attributes)) {
    const value = toAnyValue(raw, depth)
    if (value !== undefined) result[key] = value
  }
  return result
}

/** OpenTelemetry semantic-convention exception attributes. */
export function exceptionAttributes(error: unknown): AnyValueMap {
  if (error instanceof Error) {
    return {
      'exception.type': error.name,
      'exception.message': error.message,
      ...(error.stack ? { 'exception.stacktrace': error.stack } : {}),
    }
  }
  return { 'exception.type': typeof error, 'exception.message': String(error) }
}

function writeConsole(level: LogLevel, message: string, attributes: AnyValueMap): void {
  const spanContext = trace.getActiveSpan()?.spanContext()
  const line = JSON.stringify({
    level,
    message,
    ...attributes,
    ...(spanContext ? { trace_id: spanContext.traceId, span_id: spanContext.spanId } : {}),
  })
  // biome-ignore lint/suspicious/noConsole: the logger is the one sanctioned console sink.
  console[level](line)
}

function emit(
  level: LogLevel,
  message: string,
  bindings: LogAttributes,
  attributes: LogAttributes | undefined,
  error: unknown
): void {
  const merged: AnyValueMap = {
    ...toAnyValueMap({ ...bindings, ...attributes }),
    ...(error === undefined ? {} : exceptionAttributes(error)),
  }
  try {
    logs.getLogger(SERVICE_NAME).emit({
      severityNumber: SEVERITY[level],
      severityText: level.toUpperCase(),
      body: message,
      attributes: merged,
    })
  } catch {
    // Telemetry must never break the caller.
  }
  writeConsole(level, message, merged)
}

export function createLogger(bindings: LogAttributes = {}): Logger {
  return {
    debug: (message, attributes) => emit('debug', message, bindings, attributes, undefined),
    info: (message, attributes) => emit('info', message, bindings, attributes, undefined),
    warn: (message, attributes, error) => emit('warn', message, bindings, attributes, error),
    error: (message, attributes, error) => emit('error', message, bindings, attributes, error),
    child: (extra) => createLogger({ ...bindings, ...extra }),
  }
}

export const logger = createLogger()
