/**
 * @jest-environment node
 */

import { logAudit } from '~/lib/etta/utils/audit'
import { EttaAuthError, validateCoupleSession } from '~/lib/etta/utils/auth'
import { db } from '~/server/db'
import { vendorService } from '~/server/domains/vendor'

jest.mock('~/lib/etta/utils/auth', () => ({
  EttaAuthError: class EttaAuthError extends Error {
    constructor(
      message: string,
      readonly status: 401 | 403 | 412
    ) {
      super(message)
    }
  },
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
jest.mock('~/server/domains/vendor', () => {
  const validators = jest.requireActual('~/server/domains/vendor/vendor.validator')
  return {
    fieldDefinitionSchema: validators.fieldDefinitionSchema,
    vendorService: {
      getCategoryConfig: jest.fn(),
      upsertCategoryConfig: jest.fn(),
    },
  }
})
const mockBroadcast = jest.fn()
jest.mock('~/server/application/messaging', () => ({
  getWhatsAppOutbound: () => ({ broadcast: mockBroadcast }),
}))

const mockValidateSession = validateCoupleSession as jest.Mock
const mockLogAudit = logAudit as jest.Mock
const mockFindUnique = db.ettaSuggestion.findUnique as jest.Mock
const mockUpdate = db.ettaSuggestion.update as jest.Mock
const mockVendorService = vendorService as {
  getCategoryConfig: jest.Mock
  upsertCategoryConfig: jest.Mock
}

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
  mockValidateSession.mockResolvedValue({
    weddingId: WEDDING_ID,
    userId: USER_ID,
    authz: { userId: USER_ID, activeOrganization: null },
  })
  mockFindUnique.mockResolvedValue(pendingSuggestion())
  mockUpdate.mockImplementation(async ({ data, where }) => ({
    ...pendingSuggestion(),
    ...data,
    id: where.id,
  }))
  mockVendorService.getCategoryConfig.mockResolvedValue({
    fieldDefinitions: [{ key: 'budget', label: 'Budget', type: 'number', displayOrder: 0 }],
  })
  mockVendorService.upsertCategoryConfig.mockResolvedValue(undefined)
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
    mockValidateSession.mockRejectedValue(new EttaAuthError('No active session', 401))

    const res = await PATCH(makeRequest({ action: 'approve' }), makeParams())

    expect(res.status).toBe(401)
    expect((await res.json()).error).toBe('No active session')
  })

  it('returns 412 when there is no active wedding in workspace scope', async () => {
    mockValidateSession.mockRejectedValue(
      new EttaAuthError('No active wedding in workspace scope', 412)
    )

    const res = await PATCH(makeRequest({ action: 'approve' }), makeParams())

    expect(res.status).toBe(412)
    expect((await res.json()).error).toBe('No active wedding in workspace scope')
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

  describe('send_whatsapp_blast approvals', () => {
    it('broadcasts the approved message to all households', async () => {
      mockFindUnique.mockResolvedValue(
        pendingSuggestion({
          actionType: 'send_whatsapp_blast',
          tier: 'T2',
          actorId: 'etta-actor-1',
          payload: { message: 'Venue update: Garden Hall!' },
        })
      )
      mockBroadcast.mockResolvedValue({ sent: 3, failed: 0, unreachableHouseholds: 1 })

      const res = await PATCH(makeRequest({ action: 'approve' }), makeParams())

      expect(res.status).toBe(200)
      expect(mockBroadcast).toHaveBeenCalledWith(
        { userId: USER_ID, activeOrganization: null },
        { weddingId: WEDDING_ID, message: 'Venue update: Garden Hall!' }
      )
    })

    it('does not broadcast on dismiss', async () => {
      mockFindUnique.mockResolvedValue(
        pendingSuggestion({
          actionType: 'send_whatsapp_blast',
          tier: 'T2',
          payload: { message: 'hello' },
        })
      )

      const res = await PATCH(makeRequest({ action: 'dismiss' }), makeParams())

      expect(res.status).toBe(200)
      expect(mockBroadcast).not.toHaveBeenCalled()
    })

    it('returns 400 when the blast payload is invalid', async () => {
      mockFindUnique.mockResolvedValue(
        pendingSuggestion({
          actionType: 'send_whatsapp_blast',
          tier: 'T2',
          payload: { nope: true },
        })
      )

      const res = await PATCH(makeRequest({ action: 'approve' }), makeParams())

      expect(res.status).toBe(400)
      expect(mockBroadcast).not.toHaveBeenCalled()
    })
  })

  describe('SUGGEST_VENDOR_FIELD approvals', () => {
    it('appends the suggested field to the category config using authz from the session', async () => {
      mockFindUnique.mockResolvedValue(
        pendingSuggestion({
          actionType: 'SUGGEST_VENDOR_FIELD',
          summary: 'Add venue field: ceremony_site_fee',
          payload: {
            category: 'VENUE',
            key: 'ceremony_site_fee',
            label: 'Ceremony Site Fee',
            type: 'number',
            reason: 'Track separate ceremony pricing',
          },
        })
      )

      const res = await PATCH(makeRequest({ action: 'approve' }), makeParams())
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.status).toBe('approved')
      expect(mockVendorService.getCategoryConfig).toHaveBeenCalledWith(
        { userId: USER_ID, activeOrganization: null },
        WEDDING_ID,
        'VENUE'
      )
      expect(mockVendorService.upsertCategoryConfig).toHaveBeenCalledWith(
        { userId: USER_ID, activeOrganization: null },
        WEDDING_ID,
        'VENUE',
        [
          { key: 'budget', label: 'Budget', type: 'number', displayOrder: 0 },
          {
            key: 'ceremony_site_fee',
            label: 'Ceremony Site Fee',
            type: 'number',
            displayOrder: 1,
          },
        ]
      )
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: SUGGESTION_ID },
          data: expect.objectContaining({ status: 'approved', resolvedBy: USER_ID }),
        })
      )
    })

    it('does not upsert when the suggested key already exists', async () => {
      mockFindUnique.mockResolvedValue(
        pendingSuggestion({
          actionType: 'SUGGEST_VENDOR_FIELD',
          payload: {
            category: 'VENUE',
            key: 'budget',
            label: 'Budget',
            type: 'number',
            reason: 'Already tracked',
          },
        })
      )

      const res = await PATCH(makeRequest({ action: 'approve' }), makeParams())

      expect(res.status).toBe(200)
      expect(mockVendorService.getCategoryConfig).toHaveBeenCalledTimes(1)
      expect(mockVendorService.upsertCategoryConfig).not.toHaveBeenCalled()
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'approved' }),
        })
      )
    })

    it('returns 400 when the suggestion payload is invalid', async () => {
      mockFindUnique.mockResolvedValue(
        pendingSuggestion({
          actionType: 'SUGGEST_VENDOR_FIELD',
          payload: {
            category: 'VENUE',
            key: 'missing_label',
            reason: 'Incomplete payload',
          },
        })
      )

      const res = await PATCH(makeRequest({ action: 'approve' }), makeParams())

      expect(res.status).toBe(400)
      expect((await res.json()).error).toBe('Invalid suggestion payload for SUGGEST_VENDOR_FIELD')
      expect(mockVendorService.getCategoryConfig).not.toHaveBeenCalled()
      expect(mockVendorService.upsertCategoryConfig).not.toHaveBeenCalled()
      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })
})
