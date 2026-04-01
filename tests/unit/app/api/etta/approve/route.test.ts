/**
 * @jest-environment node
 */

import { validateCoupleSession } from '~/lib/etta/utils/auth'
import { logAudit } from '~/lib/etta/utils/audit'
import { db } from '~/server/db'

jest.mock('~/lib/etta/utils/auth', () => ({
  validateCoupleSession: jest.fn(),
}))
jest.mock('~/lib/etta/utils/audit', () => ({
  logAudit: jest.fn(),
}))
jest.mock('~/server/db', () => ({
  db: {
    ettaSuggestion: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const mockValidateSession = validateCoupleSession as jest.Mock
const mockLogAudit = logAudit as jest.Mock
const mockFindUnique = db.ettaSuggestion.findUnique as jest.Mock
const mockUpdate = db.ettaSuggestion.update as jest.Mock

import { PATCH } from '~/app/api/etta/approve/[suggestionId]/route'

// ── Helpers ─────────────────────────────────────────────────────────────────

const SUGGESTION_ID = 'suggestion-1'
const WEDDING_ID = 'wedding-1'
const USER_ID = 'user-1'

function makeRequest(body: unknown) {
  return new Request('http://localhost', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeParams(suggestionId = SUGGESTION_ID) {
  return { params: Promise.resolve({ suggestionId }) }
}

function pendingSuggestion(overrides: Record<string, unknown> = {}) {
  return {
    id: SUGGESTION_ID,
    weddingId: WEDDING_ID,
    status: 'pending',
    tier: 'T1',
    actionType: 'add_vendor',
    summary: 'Add a florist',
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockValidateSession.mockResolvedValue({ weddingId: WEDDING_ID, userId: USER_ID })
  mockFindUnique.mockResolvedValue(pendingSuggestion())
  mockUpdate.mockImplementation(async ({ data, where }) => ({
    ...pendingSuggestion(),
    ...data,
    id: where.id,
  }))
  mockLogAudit.mockResolvedValue(undefined)
})

// ── Approve ─────────────────────────────────────────────────────────────────

describe('PATCH /api/etta/approve/[suggestionId]', () => {
  it('approves a pending suggestion and returns 200', async () => {
    const res = await PATCH(makeRequest({ action: 'approve' }), makeParams())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('approved')
    expect(body.message).toBe('Suggestion approved')
  })

  it('dismisses a pending suggestion and returns 200', async () => {
    const res = await PATCH(makeRequest({ action: 'dismiss' }), makeParams())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('dismissed')
    expect(body.message).toBe('Suggestion dismissed')
  })

  // ── Validation ──────────────────────────────────────────────────────────

  it('returns 400 when body is missing the action field', async () => {
    const res = await PATCH(makeRequest({}), makeParams())

    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/Invalid action/)
  })

  it('returns 400 when action is not a valid enum value', async () => {
    const res = await PATCH(makeRequest({ action: 'reject' }), makeParams())

    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/Invalid action/)
  })

  // ── Authentication ──────────────────────────────────────────────────────

  it('returns 401 when there is no active session', async () => {
    mockValidateSession.mockRejectedValue(new Error('No active session'))

    const res = await PATCH(makeRequest({ action: 'approve' }), makeParams())

    expect(res.status).toBe(401)
    expect((await res.json()).error).toBe('No active session')
  })

  // ── Authorization / ownership ───────────────────────────────────────────

  it('returns 404 when suggestion does not exist', async () => {
    mockFindUnique.mockResolvedValue(null)

    const res = await PATCH(makeRequest({ action: 'approve' }), makeParams())

    expect(res.status).toBe(404)
    expect((await res.json()).error).toBe('Suggestion not found')
  })

  it('returns 404 when suggestion belongs to a different wedding', async () => {
    mockFindUnique.mockResolvedValue(pendingSuggestion({ weddingId: 'other-wedding' }))

    const res = await PATCH(makeRequest({ action: 'approve' }), makeParams())

    expect(res.status).toBe(404)
    expect((await res.json()).error).toBe('Suggestion not found')
  })

  // ── Conflict ────────────────────────────────────────────────────────────

  it('returns 409 when suggestion is already resolved', async () => {
    mockFindUnique.mockResolvedValue(pendingSuggestion({ status: 'approved' }))

    const res = await PATCH(makeRequest({ action: 'approve' }), makeParams())

    expect(res.status).toBe(409)
    expect((await res.json()).error).toBe('Suggestion already approved')
  })

  // ── Audit logging ──────────────────────────────────────────────────────

  it('calls logAudit with correct args on approve', async () => {
    await PATCH(makeRequest({ action: 'approve' }), makeParams())

    expect(mockLogAudit).toHaveBeenCalledWith({
      weddingId: WEDDING_ID,
      actorId: USER_ID,
      actorType: 'couple',
      action: 'suggestion_approve',
      resourceType: 'etta_suggestion',
      resourceId: SUGGESTION_ID,
      tier: 'T1',
      payload: { actionType: 'add_vendor', summary: 'Add a florist' },
    })
  })

  // ── Database update ─────────────────────────────────────────────────────

  it('sets resolvedAt and resolvedBy on the update call', async () => {
    const before = new Date()
    await PATCH(makeRequest({ action: 'approve' }), makeParams())
    const after = new Date()

    expect(mockUpdate).toHaveBeenCalledTimes(1)
    const { data } = mockUpdate.mock.calls[0][0]

    expect(data.resolvedBy).toBe(USER_ID)
    expect(data.status).toBe('approved')
    expect(new Date(data.resolvedAt).getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(new Date(data.resolvedAt).getTime()).toBeLessThanOrEqual(after.getTime())
  })
})
