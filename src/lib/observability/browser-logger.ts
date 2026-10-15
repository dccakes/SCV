/**
 * Browser structured logger backed by PostHog Logs (OTLP under the hood).
 *
 * posthog-js stamps every record with the current distinct id and session id,
 * so logs line up with the session replay. Records go to PostHog only, not
 * the browser console; in development they are mirrored to the console.
 */

import posthog from 'posthog-js'

type LogAttributes = Readonly<Record<string, unknown>>
type Level = 'debug' | 'info' | 'warn' | 'error'

function errorAttributes(error: unknown): Record<string, unknown> {
  return error instanceof Error
    ? {
        'exception.type': error.name,
        'exception.message': error.message,
        'exception.stacktrace': error.stack,
      }
    : { 'exception.message': String(error) }
}

function emit(level: Level, message: string, attributes?: LogAttributes, error?: unknown): void {
  const merged = { ...attributes, ...(error === undefined ? {} : errorAttributes(error)) }
  if (process.env.NODE_ENV === 'development') {
    // biome-ignore lint/suspicious/noConsole: development mirror of PostHog logs.
    console[level](message, merged)
  }
  if (!posthog.__loaded) return
  try {
    posthog.logger[level](message, merged as Parameters<typeof posthog.logger.info>[1])
  } catch {
    // Telemetry must never break the UI.
  }
}

export const browserLogger = {
  debug: (message: string, attributes?: LogAttributes) => emit('debug', message, attributes),
  info: (message: string, attributes?: LogAttributes) => emit('info', message, attributes),
  warn: (message: string, attributes?: LogAttributes, error?: unknown) =>
    emit('warn', message, attributes, error),
  error: (message: string, attributes?: LogAttributes, error?: unknown) =>
    emit('error', message, attributes, error),
}
