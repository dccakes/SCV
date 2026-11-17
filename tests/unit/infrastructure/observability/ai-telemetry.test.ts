/**
 * @jest-environment node
 */
const mockRegisterTelemetry = jest.fn()
jest.mock('ai', () => ({
  registerTelemetry: (...args: unknown[]) => mockRegisterTelemetry(...args),
}))
jest.mock('@ai-sdk/otel', () => ({
  OpenTelemetry: jest.fn().mockImplementation((options: unknown) => ({ options })),
}))

import { OpenTelemetry } from '@ai-sdk/otel'

import {
  ETTA_TELEMETRY_CONTEXT,
  enrichAiSpan,
  registerAiTelemetry,
} from '~/server/infrastructure/observability/ai-telemetry'

const enrich = (runtimeContext: Record<string, unknown> | undefined) =>
  enrichAiSpan({ spanType: 'languageModel', operationId: 'op', callId: 'call', runtimeContext })

describe('enrichAiSpan', () => {
  it('maps the call context onto the attributes PostHog AI observability reads', () => {
    expect(
      enrich({
        distinctId: 'user-1',
        sessionId: 'chat-1',
        browserSessionId: 'replay-1',
        properties: { wedding_id: 'w1', persona: 'couple', steps: 3, nested: { a: 1 } },
      })
    ).toEqual({
      'posthog.distinct_id': 'user-1',
      $ai_session_id: 'chat-1',
      $session_id: 'replay-1',
      wedding_id: 'w1',
      persona: 'couple',
      steps: 3,
    })
  })

  it('adds nothing for calls without context', () => {
    expect(enrich(undefined)).toEqual({})
    expect(enrich({ distinctId: 42, properties: 'nope' })).toEqual({})
  })

  it('never lets custom properties overwrite identity attributes', () => {
    expect(
      enrich({ distinctId: 'user-1', properties: { 'posthog.distinct_id': 'spoofed' } })
    ).toEqual({ 'posthog.distinct_id': 'user-1' })
  })
})

describe('registerAiTelemetry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    delete (globalThis as Record<string, unknown>).__SCV_AI_TELEMETRY_REGISTERED__
  })

  it('registers the OpenTelemetry integration once, named after the function id', () => {
    registerAiTelemetry()
    registerAiTelemetry()

    expect(mockRegisterTelemetry).toHaveBeenCalledTimes(1)
    expect(OpenTelemetry).toHaveBeenCalledWith({
      agentSpanName: 'functionId',
      enrichSpan: enrichAiSpan,
    })
  })
})

describe('ETTA_TELEMETRY_CONTEXT', () => {
  it('opts every mapped context field into telemetry (all are off by default in v7)', () => {
    expect(ETTA_TELEMETRY_CONTEXT).toEqual({
      distinctId: true,
      sessionId: true,
      browserSessionId: true,
      properties: true,
    })
  })
})
