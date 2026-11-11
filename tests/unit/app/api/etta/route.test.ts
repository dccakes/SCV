/** @jest-environment node */

const mockResolveEttaAuth = jest.fn()
const mockRunEttaAgent = jest.fn()
const mockLogAudit = jest.fn()
const mockEnforce = jest.fn()

jest.mock('~/server/db', () => ({ db: {} }))
jest.mock('~/lib/etta/agent', () => ({ runEttaAgent: (...a: unknown[]) => mockRunEttaAgent(...a) }))
jest.mock('~/lib/etta/utils/audit', () => ({ logAudit: (...a: unknown[]) => mockLogAudit(...a) }))
jest.mock('~/lib/etta/utils/auth', () => ({
  EttaAuthError: class EttaAuthError extends Error {
    constructor(
      message: string,
      readonly status: number
    ) {
      super(message)
    }
  },
  resolveEttaAuth: (...a: unknown[]) => mockResolveEttaAuth(...a),
}))
jest.mock('~/server/infrastructure/rate-limit', () => ({
  ...jest.requireActual('~/server/infrastructure/rate-limit'),
  enforceRateLimit: (...a: unknown[]) => mockEnforce(...a),
}))

const mockCaptureServerException = jest.fn()
jest.mock('~/server/infrastructure/observability/capture-exception', () => ({
  captureServerException: (...a: unknown[]) => mockCaptureServerException(...a),
}))

import { POST } from '~/app/api/etta/route'
import { EttaAuthError } from '~/lib/etta/utils/auth'
import type { EnforceResult } from '~/server/infrastructure/rate-limit'

const allowed: EnforceResult = {
  allowed: true,
  retryAfterSeconds: 0,
  limit: 20,
  remaining: 19,
  resetSeconds: 60,
}
const blocked: EnforceResult = { ...allowed, allowed: false, remaining: 0, retryAfterSeconds: 33 }

const request = () => new Request('https://example.com/api/etta', { method: 'POST', body: '{}' })

describe('POST /api/etta rate limiting', () => {
  beforeEach(() => {
    mockEnforce.mockResolvedValue(allowed)
    mockRunEttaAgent.mockResolvedValue({
      toUIMessageStreamResponse: () => new Response('stream'),
    })
  })

  it('limits couple members per user id', async () => {
    mockResolveEttaAuth.mockResolvedValue({
      actor: 'couple',
      weddingId: 'w1',
      authz: { userId: 'u1' },
    })

    const response = await POST(request())

    expect(mockEnforce).toHaveBeenCalledWith('etta', 'u1')
    expect(await response.text()).toBe('stream')
  })

  it('limits guests per wedding and guest so ids from different weddings cannot collide', async () => {
    mockResolveEttaAuth.mockResolvedValue({ actor: 'guest', weddingId: 'w1', guestId: 7 })

    await POST(request())
    mockResolveEttaAuth.mockResolvedValue({ actor: 'guest', weddingId: 'w2', guestId: 7 })
    await POST(request())

    expect(mockEnforce).toHaveBeenNthCalledWith(1, 'etta', 'guest:w1:7')
    expect(mockEnforce).toHaveBeenNthCalledWith(2, 'etta', 'guest:w2:7')
  })

  it('returns 429 with Retry-After before spending any LLM tokens', async () => {
    mockResolveEttaAuth.mockResolvedValue({
      actor: 'couple',
      weddingId: 'w1',
      authz: { userId: 'u1' },
    })
    mockEnforce.mockResolvedValue(blocked)

    const response = await POST(request())

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('33')
    expect(mockRunEttaAgent).not.toHaveBeenCalled()
  })

  it('rejects unauthenticated requests with 401 and never touches the limiter', async () => {
    mockResolveEttaAuth.mockRejectedValue(new EttaAuthError('No active session', 401))

    const response = await POST(request())

    expect(response.status).toBe(401)
    expect(mockEnforce).not.toHaveBeenCalled()
  })

  it('keeps the audit actor id format for guests unchanged', async () => {
    mockResolveEttaAuth.mockResolvedValue({ actor: 'guest', weddingId: 'w1', guestId: 7 })
    mockRunEttaAgent.mockRejectedValue(new Error('model down'))

    await POST(request())

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({ weddingId: 'w1', actorId: 'guest:7', actorType: 'guest' })
    )
  })
})

describe('POST /api/etta error tracking', () => {
  beforeEach(() => {
    mockCaptureServerException.mockReset()
    mockEnforce.mockResolvedValue(allowed)
    mockResolveEttaAuth.mockResolvedValue({
      actor: 'couple',
      weddingId: 'w1',
      authz: { userId: 'u1' },
    })
  })

  it('reports unexpected failures with the signed-in user', async () => {
    const failure = new Error('gateway exploded')
    mockRunEttaAgent.mockRejectedValue(failure)

    const response = await POST(request())

    expect(response.status).toBe(500)
    expect(mockCaptureServerException).toHaveBeenCalledWith(failure, {
      userId: 'u1',
      properties: { source: 'etta-route', status: 500, persona: 'couple', wedding_id: 'w1' },
    })
  })

  it('does not report expected auth failures', async () => {
    mockResolveEttaAuth.mockRejectedValue(new EttaAuthError('No active session', 401))

    const response = await POST(request())

    expect(response.status).toBe(401)
    expect(mockCaptureServerException).not.toHaveBeenCalled()
  })
})
