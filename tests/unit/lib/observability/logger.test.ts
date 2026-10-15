/**
 * @jest-environment node
 */
import { context, trace } from '@opentelemetry/api'
import { logs, SeverityNumber } from '@opentelemetry/api-logs'
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks'
import {
  InMemoryLogRecordExporter,
  LoggerProvider,
  SimpleLogRecordProcessor,
} from '@opentelemetry/sdk-logs'
import { BasicTracerProvider } from '@opentelemetry/sdk-trace-base'

import { createLogger, logger } from '~/lib/observability/logger'

const exporter = new InMemoryLogRecordExporter()
const provider = new LoggerProvider({ processors: [new SimpleLogRecordProcessor({ exporter })] })
const contextManager = new AsyncLocalStorageContextManager().enable()

beforeAll(() => {
  context.setGlobalContextManager(contextManager)
  logs.setGlobalLoggerProvider(provider)
})

afterAll(async () => {
  await provider.shutdown()
  context.disable()
})

let consoleSpies: jest.SpyInstance[] = []

beforeEach(() => {
  exporter.reset()
  consoleSpies = (['debug', 'info', 'warn', 'error'] as const).map((level) =>
    jest.spyOn(console, level).mockImplementation(() => undefined)
  )
})

afterEach(() => {
  for (const spy of consoleSpies) spy.mockRestore()
})

describe('logger', () => {
  it('emits OTel log records with severity, body, and attributes', () => {
    logger.info('Guest registered', { wedding_id: 'wed_1', count: 2, ok: true })

    const [record] = exporter.getFinishedLogRecords()
    expect(record?.body).toBe('Guest registered')
    expect(record?.severityNumber).toBe(SeverityNumber.INFO)
    expect(record?.severityText).toBe('INFO')
    expect(record?.attributes).toEqual({ wedding_id: 'wed_1', count: 2, ok: true })
  })

  it('adds semantic-convention exception attributes for errors', () => {
    logger.error('Upload failed', { 'blob.count': 3 }, new TypeError('boom'))

    const [record] = exporter.getFinishedLogRecords()
    expect(record?.severityNumber).toBe(SeverityNumber.ERROR)
    expect(record?.attributes).toMatchObject({
      'blob.count': 3,
      'exception.type': 'TypeError',
      'exception.message': 'boom',
    })
    expect(record?.attributes['exception.stacktrace']).toEqual(expect.stringContaining('boom'))
  })

  it('normalizes dates, nested objects, and drops nullish values', () => {
    const at = new Date('2026-10-15T00:00:00.000Z')
    logger.warn('Odd input', { at, nested: { a: 1, b: undefined }, missing: null, big: 10n })

    const [record] = exporter.getFinishedLogRecords()
    expect(record?.attributes).toEqual({
      at: '2026-10-15T00:00:00.000Z',
      nested: { a: 1 },
      big: '10',
    })
  })

  it('merges child bindings into every record', () => {
    createLogger({ component: 'etta' }).child({ wedding_id: 'wed_9' }).debug('Step done')

    const [record] = exporter.getFinishedLogRecords()
    expect(record?.attributes).toEqual({ component: 'etta', wedding_id: 'wed_9' })
  })

  it('correlates records with the active span and mirrors them to the console', () => {
    const tracer = new BasicTracerProvider().getTracer('test')
    const span = tracer.startSpan('request')
    context.with(trace.setSpan(context.active(), span), () => {
      logger.error('Inside request')
    })
    span.end()

    const [record] = exporter.getFinishedLogRecords()
    expect(record?.spanContext?.traceId).toBe(span.spanContext().traceId)
    expect(record?.spanContext?.spanId).toBe(span.spanContext().spanId)

    const errorSpy = consoleSpies[3] as jest.SpyInstance
    const line = JSON.parse(errorSpy.mock.calls[0][0] as string)
    expect(line).toMatchObject({
      level: 'error',
      message: 'Inside request',
      trace_id: span.spanContext().traceId,
    })
  })
})
