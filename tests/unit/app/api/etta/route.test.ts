/**
 * @jest-environment node
 */

import { runEttaAgent } from '~/lib/etta/agent'
import { logAudit } from '~/lib/etta/utils/audit'
import { EttaAuthError, resolveEttaAuth } from '~/lib/etta/utils/auth'

jest.mock('~/lib/etta/utils/auth', () => ({
  EttaAuthError: class EttaAuthError extends Error {
    constructor(
      message: string,
      readonly status: 401 | 403 | 412
    ) {
      super(message)
    }
  },
  resolveEttaAuth: jest.fn(),
}))

jest.mock('~/lib/etta/agent', () => ({
  runEttaAgent: jest.fn(),
}))

jest.mock('~/lib/etta/utils/audit', () => ({
  logAudit: jest.fn(),
}))

const mockResolveAuth = resolveEttaAuth as jest.Mock
const mockRunAgent = runEttaAgent as jest.Mock
const mockLogAudit = logAudit as jest.Mock

import { POST } from '~/app/api/etta/route'

function makeRequest(body: Record<string, unknown> = {}) {
  return new Request('http://localhost/api/etta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/etta', () => {
  beforeEach(() => jest.clearAllMocks())

  it('streams a response for a valid couple request', async () => {
    const ettaReq = {
      actor: 'couple',
      weddingId: 'w-1',
      messages: [{ role: 'user', content: 'hello' }],
    }
    mockResolveAuth.mockResolvedValue(ettaReq)
    mockRunAgent.mockResolvedValue({
      toUIMessageStreamResponse: () => new Response('streamed', { status: 200 }),
    })

    const res = await POST(makeRequest({ messages: [{ role: 'user', content: 'hello' }] }))

    expect(res.status).toBe(200)
    expect(mockResolveAuth).toHaveBeenCalled()
    expect(mockRunAgent).toHaveBeenCalledWith(ettaReq)
  })

  it('returns 401 for "No active session"', async () => {
    mockResolveAuth.mockRejectedValue(new Error('No active session'))

    const res = await POST(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('No active session')
    expect(mockLogAudit).not.toHaveBeenCalled()
  })

  it('returns 401 for token-related errors', async () => {
    mockResolveAuth.mockRejectedValue(new Error('Invalid guest token: missing claims'))

    const res = await POST(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toContain('token')
  })

  it('returns 412 when there is no active wedding in workspace scope', async () => {
    mockResolveAuth.mockRejectedValue(
      new EttaAuthError('No active wedding in workspace scope', 412)
    )

    const res = await POST(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(412)
    expect(body.error).toBe('No active wedding in workspace scope')
  })

  it('returns 404 for "No wedding found for user"', async () => {
    mockResolveAuth.mockRejectedValue(new Error('No wedding found for user'))

    const res = await POST(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toContain('No wedding found')
  })

  it('returns 500 for unknown errors', async () => {
    mockResolveAuth.mockRejectedValue(new Error('Something unexpected'))

    const res = await POST(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Something unexpected')
  })

  it('returns 503 for missing Etta runtime configuration', async () => {
    mockResolveAuth.mockResolvedValue({
      actor: 'couple',
      weddingId: 'w-1',
      authz: { userId: 'user-1', activeOrganization: null },
      messages: [{ role: 'user', content: 'hello' }],
    })
    mockRunAgent.mockRejectedValue(
      new Error('Etta is not configured: AI_GATEWAY_API_KEY is missing')
    )

    const res = await POST(makeRequest({ messages: [{ role: 'user', content: 'hello' }] }))
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.error).toBe('Etta is not configured: AI_GATEWAY_API_KEY is missing')
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'chat_error',
        weddingId: 'w-1',
      })
    )
  })
})
