/**
 * @jest-environment node
 */

import { TRPCError } from '@trpc/server'
import { runApprovedSuggestion } from '~/lib/etta/execution/run-approved-suggestion'
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
jest.mock('~/lib/etta/execution/run-approved-suggestion', () => ({
  runApprovedSuggestion: jest.fn(),
}))
const mockRequireSuggestionReviewPermission = jest.fn()
jest.mock('~/server/domains/etta-suggestion/etta-suggestion.auth', () => ({
  requireSuggestionReviewPermission: (...args: unknown[]) =>
    mockRequireSuggestionReviewPermission(...args),
}))
jest.mock('~/server/db', () => ({
  db: {
    ettaSuggestion: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
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

const mockValidateSession = validateCoupleSession as jest.Mock
const mockLogAudit = logAudit as jest.Mock
const mockRunApprovedSuggestion = runApprovedSuggestion as jest.Mock
const mockFindUnique = db.ettaSuggestion.findUnique as jest.Mock
const mockUpdateMany = db.ettaSuggestion.updateMany as jest.Mock
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
  mockRequireSuggestionReviewPermission.mockReturnValue(undefined)
  mockValidateSession.mockResolvedValue({
    weddingId: WEDDING_ID,
    userId: USER_ID,
    authz: {
      userId: USER_ID,
      activeOrganization: { organizationId: 'org-1', role: 'owner' },
    },
  })
  mockFindUnique.mockResolvedValue(pendingSuggestion())
  mockUpdateMany.mockResolvedValue({ count: 1 })
  mockVendorService.getCategoryConfig.mockResolvedValue({
    fieldDefinitions: [{ key: 'budget', label: 'Budget', type: 'number', displayOrder: 0 }],
  })
  mockVendorService.upsertCategoryConfig.mockResolvedValue(undefined)
  mockLogAudit.mockResolvedValue(undefined)
  mockRunApprovedSuggestion.mockResolvedValue(undefined)
})

// ── Approve ─────────────────────────────────────────────────────────────────

describe('PATCH /api/etta/approve/[suggestionId]', () => {
  it('approves a pending suggestion and returns 200', async () => {
    const res = await PATCH(makeRequest({ action: 'approve' }), makeParams())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('approved')
    expect(body.message).toBe('Suggestion approved')
    expect(mockRunApprovedSuggestion).toHaveBeenCalledWith({
      authz: {
        userId: USER_ID,
        activeOrganization: { organizationId: 'org-1', role: 'owner' },
      },
      suggestion: expect.objectContaining({
        id: SUGGESTION_ID,
        weddingId: WEDDING_ID,
        status: 'approved',
      }),
    })
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

  it('returns 403 when the current member cannot review suggestions', async () => {
    mockRequireSuggestionReviewPermission.mockImplementation(() => {
      throw new TRPCError({ code: 'FORBIDDEN' })
    })

    const res = await PATCH(makeRequest({ action: 'approve' }), makeParams())

    expect(res.status).toBe(403)
    expect(mockFindUnique).not.toHaveBeenCalled()
    expect(mockRunApprovedSuggestion).not.toHaveBeenCalled()
  })

  // ── Conflict ────────────────────────────────────────────────────────────

  it('retries a failed suggestion by resetting it to approved', async () => {
    mockFindUnique.mockResolvedValue(
      pendingSuggestion({
        status: 'failed',
        failureReason: 'Vendor payload missing category',
      })
    )

    const res = await PATCH(makeRequest({ action: 'approve' }), makeParams())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('approved')
    expect(body.message).toBe('Suggestion approved')
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: {
        id: SUGGESTION_ID,
        weddingId: WEDDING_ID,
        status: 'failed',
      },
      data: expect.objectContaining({
        status: 'approved',
        failureReason: null,
        executedAt: null,
      }),
    })
    expect(mockRunApprovedSuggestion).toHaveBeenCalledWith({
      authz: {
        userId: USER_ID,
        activeOrganization: { organizationId: 'org-1', role: 'owner' },
      },
      suggestion: expect.objectContaining({
        id: SUGGESTION_ID,
        weddingId: WEDDING_ID,
        status: 'approved',
      }),
    })
  })

  it('treats re-approving an in-flight suggestion as an idempotent no-op', async () => {
    mockFindUnique.mockResolvedValue(pendingSuggestion({ status: 'approved' }))

    const res = await PATCH(makeRequest({ action: 'approve' }), makeParams())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('approved')
    expect(body.message).toBe('Suggestion already approved')
    expect(mockUpdateMany).not.toHaveBeenCalled()
    expect(mockRunApprovedSuggestion).not.toHaveBeenCalled()
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

    expect(mockUpdateMany).toHaveBeenCalledTimes(1)
    const { data } = mockUpdateMany.mock.calls[0][0]

    expect(data.resolvedBy).toBe(USER_ID)
    expect(data.status).toBe('approved')
    expect(new Date(data.resolvedAt).getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(new Date(data.resolvedAt).getTime()).toBeLessThanOrEqual(after.getTime())
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
      expect(body.status).toBe('actioned')
      expect(mockVendorService.getCategoryConfig).toHaveBeenCalledWith(
        {
          userId: USER_ID,
          activeOrganization: { organizationId: 'org-1', role: 'owner' },
        },
        WEDDING_ID,
        'VENUE'
      )
      expect(mockVendorService.upsertCategoryConfig).toHaveBeenCalledWith(
        {
          userId: USER_ID,
          activeOrganization: { organizationId: 'org-1', role: 'owner' },
        },
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
      expect(mockUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: SUGGESTION_ID,
            weddingId: WEDDING_ID,
            status: 'pending',
          },
          data: expect.objectContaining({
            status: 'actioned',
            resolvedBy: USER_ID,
            executedAt: expect.any(Date),
          }),
        })
      )
      expect(mockRunApprovedSuggestion).not.toHaveBeenCalled()
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
      expect(mockUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'actioned',
            executedAt: expect.any(Date),
          }),
        })
      )
      expect(mockRunApprovedSuggestion).not.toHaveBeenCalled()
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
      expect(mockUpdateMany).not.toHaveBeenCalled()
    })
  })
})
