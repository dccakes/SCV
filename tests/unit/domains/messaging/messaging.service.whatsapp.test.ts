/**
 * Tests for Messaging Domain Service — WhatsApp guest channel
 */

import { TRPCError } from '@trpc/server'

jest.mock('~/env', () => ({
  env: new Proxy({} as Record<string, string | undefined>, {
    get: (_t, prop: string) => process.env[prop],
  }),
}))

jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(),
}))

jest.mock('~/server/domains/messaging/messaging.repository')

import type { AuthzContext } from '~/server/authz/authorization.types'
// @ts-expect-error - Importing mock functions from mocked module
import {
  MessagingRepository,
  mockClaimAvailableWhatsAppNumber,
  mockFindActiveWhatsAppIdentities,
  mockFindGuestByPhone,
  mockFindHouseholdsWithGuestPhones,
  mockFindIdentityById,
  mockFindMessagesForIdentity,
  mockFindOrCreateWhatsAppIdentity,
  mockFindWhatsAppConversations,
  mockFindWhatsAppNumberByPhone,
  mockFindWhatsAppNumberForWedding,
  mockWhatsAppIdentity,
  mockWhatsAppNumber,
  resetMocks,
} from '~/server/domains/messaging/messaging.repository'
import { MessagingService } from '~/server/domains/messaging/messaging.service'

const mockFindWhatsAppNumberByPhoneFn = mockFindWhatsAppNumberByPhone as jest.Mock
const mockFindWhatsAppNumberForWeddingFn = mockFindWhatsAppNumberForWedding as jest.Mock
const mockClaimAvailableWhatsAppNumberFn = mockClaimAvailableWhatsAppNumber as jest.Mock
const mockFindGuestByPhoneFn = mockFindGuestByPhone as jest.Mock
const mockFindOrCreateWhatsAppIdentityFn = mockFindOrCreateWhatsAppIdentity as jest.Mock
const mockFindWhatsAppConversationsFn = mockFindWhatsAppConversations as jest.Mock
const mockFindMessagesForIdentityFn = mockFindMessagesForIdentity as jest.Mock
const mockFindIdentityByIdFn = mockFindIdentityById as jest.Mock
const mockFindHouseholdsWithGuestPhonesFn = mockFindHouseholdsWithGuestPhones as jest.Mock
const mockFindActiveWhatsAppIdentitiesFn = mockFindActiveWhatsAppIdentities as jest.Mock

const ctx: AuthzContext = {
  userId: 'user-1',
  activeOrganization: { organizationId: 'org-1', role: 'owner' },
}

describe('MessagingService — WhatsApp', () => {
  let service: MessagingService

  beforeEach(() => {
    resetMocks()
    service = new MessagingService(new MessagingRepository({}))
  })

  describe('resolveInboundWhatsApp', () => {
    it('resolves a known guest to an identity linked to their household', async () => {
      mockFindWhatsAppNumberByPhoneFn.mockResolvedValue(mockWhatsAppNumber)
      mockFindGuestByPhoneFn.mockResolvedValue({
        id: 7,
        householdId: 'household-1',
        firstName: 'Maria',
        lastName: 'Lopez',
      })
      mockFindOrCreateWhatsAppIdentityFn.mockResolvedValue(mockWhatsAppIdentity)

      const result = await service.resolveInboundWhatsApp({
        serviceNumber: '+14155550100',
        attendeePhone: '+5215512345678',
        profileName: 'Maria',
      })

      expect(result).toEqual({
        status: 'ok',
        weddingId: 'wedding-123',
        identity: mockWhatsAppIdentity,
      })
      expect(mockFindOrCreateWhatsAppIdentityFn).toHaveBeenCalledWith(
        expect.objectContaining({
          weddingId: 'wedding-123',
          serviceNumber: '+14155550100',
          externalChatId: '+5215512345678',
          guestId: 7,
          householdId: 'household-1',
        })
      )
    })

    it('returns unknown_number when no wedding owns the receiving number', async () => {
      mockFindWhatsAppNumberByPhoneFn.mockResolvedValue(null)

      const result = await service.resolveInboundWhatsApp({
        serviceNumber: '+14155550999',
        attendeePhone: '+5215512345678',
      })

      expect(result).toEqual({ status: 'unknown_number' })
      expect(mockFindOrCreateWhatsAppIdentityFn).not.toHaveBeenCalled()
    })

    it('returns unknown_guest when the sender is not on the guest list', async () => {
      mockFindWhatsAppNumberByPhoneFn.mockResolvedValue(mockWhatsAppNumber)
      mockFindGuestByPhoneFn.mockResolvedValue(null)

      const result = await service.resolveInboundWhatsApp({
        serviceNumber: '+14155550100',
        attendeePhone: '+5215500000000',
      })

      expect(result).toEqual({ status: 'unknown_guest', weddingId: 'wedding-123' })
      expect(mockFindOrCreateWhatsAppIdentityFn).not.toHaveBeenCalled()
    })

    it('returns unknown_number for a pool number not yet assigned to a wedding', async () => {
      mockFindWhatsAppNumberByPhoneFn.mockResolvedValue({
        ...mockWhatsAppNumber,
        weddingId: null,
        status: 'available',
      })

      const result = await service.resolveInboundWhatsApp({
        serviceNumber: '+14155550100',
        attendeePhone: '+5215512345678',
      })

      expect(result).toEqual({ status: 'unknown_number' })
    })
  })

  describe('assignWhatsAppNumber', () => {
    it('returns the already-assigned number without claiming a new one', async () => {
      mockFindWhatsAppNumberForWeddingFn.mockResolvedValue(mockWhatsAppNumber)

      const result = await service.assignWhatsAppNumber(ctx, 'wedding-123')

      expect(result).toEqual(mockWhatsAppNumber)
      expect(mockClaimAvailableWhatsAppNumberFn).not.toHaveBeenCalled()
    })

    it('claims an available number from the pool', async () => {
      mockFindWhatsAppNumberForWeddingFn.mockResolvedValue(null)
      mockClaimAvailableWhatsAppNumberFn.mockResolvedValue(mockWhatsAppNumber)

      const result = await service.assignWhatsAppNumber(ctx, 'wedding-123')

      expect(result).toEqual(mockWhatsAppNumber)
      expect(mockClaimAvailableWhatsAppNumberFn).toHaveBeenCalledWith('wedding-123')
    })

    it('throws PRECONDITION_FAILED when the pool is exhausted', async () => {
      mockFindWhatsAppNumberForWeddingFn.mockResolvedValue(null)
      mockClaimAvailableWhatsAppNumberFn.mockResolvedValue(null)

      await expect(service.assignWhatsAppNumber(ctx, 'wedding-123')).rejects.toThrow(TRPCError)
    })
  })

  describe('getWhatsAppStatus', () => {
    it('returns the assigned number and conversation count', async () => {
      mockFindWhatsAppNumberForWeddingFn.mockResolvedValue(mockWhatsAppNumber)
      mockFindWhatsAppConversationsFn.mockResolvedValue([{ id: 'identity-wa-1' }])

      const result = await service.getWhatsAppStatus(ctx, 'wedding-123')

      expect(result.number?.phoneNumber).toBe('+14155550100')
      expect(result.conversationCount).toBe(1)
    })

    it('returns null number when the wedding has not claimed one', async () => {
      mockFindWhatsAppNumberForWeddingFn.mockResolvedValue(null)
      mockFindWhatsAppConversationsFn.mockResolvedValue([])

      const result = await service.getWhatsAppStatus(ctx, 'wedding-123')

      expect(result.number).toBeNull()
      expect(result.conversationCount).toBe(0)
    })
  })

  describe('getConversationMessages', () => {
    it('returns messages for an identity belonging to the wedding', async () => {
      mockFindIdentityByIdFn.mockResolvedValue(mockWhatsAppIdentity)
      mockFindMessagesForIdentityFn.mockResolvedValue([{ id: 'm1' }])

      const result = await service.getConversationMessages(ctx, 'wedding-123', 'identity-wa-1')

      expect(result).toEqual([{ id: 'm1' }])
    })

    it('rejects an identity from another wedding', async () => {
      mockFindIdentityByIdFn.mockResolvedValue({
        ...mockWhatsAppIdentity,
        weddingId: 'other-wedding',
      })

      await expect(
        service.getConversationMessages(ctx, 'wedding-123', 'identity-wa-1')
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('getBroadcastRecipients', () => {
    it('prefers an existing conversation identity per household, else the primary contact with a phone', async () => {
      mockFindActiveWhatsAppIdentitiesFn.mockResolvedValue([mockWhatsAppIdentity])
      mockFindHouseholdsWithGuestPhonesFn.mockResolvedValue([
        {
          id: 'household-1',
          guests: [
            {
              id: 7,
              firstName: 'Maria',
              lastName: 'Lopez',
              phone: '+5215512345678',
              isPrimaryContact: true,
            },
          ],
        },
        {
          id: 'household-2',
          guests: [
            { id: 8, firstName: 'Ana', lastName: 'Kim', phone: null, isPrimaryContact: true },
            {
              id: 9,
              firstName: 'Ben',
              lastName: 'Kim',
              phone: '+15550001111',
              isPrimaryContact: false,
            },
          ],
        },
        {
          id: 'household-3',
          guests: [
            {
              id: 10,
              firstName: 'Nophone',
              lastName: 'Person',
              phone: null,
              isPrimaryContact: true,
            },
          ],
        },
      ])

      const result = await service.getBroadcastRecipients('wedding-123')

      expect(result.recipients).toEqual([
        expect.objectContaining({
          householdId: 'household-1',
          phone: '+5215512345678',
          identityId: 'identity-wa-1',
          guestId: 7,
        }),
        expect.objectContaining({
          householdId: 'household-2',
          phone: '+15550001111',
          identityId: null,
          guestId: 9,
        }),
      ])
      expect(result.unreachableHouseholdIds).toEqual(['household-3'])
    })
  })
})
