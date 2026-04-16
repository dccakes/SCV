/**
 * @jest-environment node
 */

jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(() => ({ organizationId: 'org-1', role: 'owner' })),
}))

jest.mock('~/server/domains/household/household.repository')
jest.mock('~/server/domains/guest/guest.repository')
jest.mock('~/server/domains/invitation/invitation.repository')
jest.mock('~/server/domains/gift/gift.repository')

import { TRPCError } from '@trpc/server'
import { HouseholdManagementService } from '~/server/application/household-management/household-management.service'
import { requirePermission } from '~/server/authz/permission-checker'
import { GiftRepository } from '~/server/domains/gift/gift.repository'
import { GuestRepository } from '~/server/domains/guest/guest.repository'
import { HouseholdRepository } from '~/server/domains/household/household.repository'
import { InvitationRepository } from '~/server/domains/invitation/invitation.repository'

const mockRequirePermission = requirePermission as jest.Mock

const householdRepo = new HouseholdRepository(null as never)
const guestRepo = new GuestRepository(null as never)
const invitationRepo = new InvitationRepository(null as never)
const giftRepo = new GiftRepository(null as never)

const mockHouseholdRepo = householdRepo as unknown as {
  update: jest.Mock
  belongsToWedding: jest.Mock
}

const service = new HouseholdManagementService(
  householdRepo,
  guestRepo,
  invitationRepo,
  giftRepo,
  null as never // db - not needed for this test
)

const authz = { userId: 'user-1', activeOrganization: { organizationId: 'org-1', role: 'owner' } }

describe('HouseholdManagementService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequirePermission.mockReturnValue({ organizationId: 'org-1', role: 'owner' })
  })

  describe('updateHouseholdAddress', () => {
    const weddingId = 'wedding-123'
    const householdId = 'household-123'
    const addressData = {
      address1: '456 Oak Ave',
      city: 'Brooklyn',
      state: 'NY',
      zipCode: '11201',
      country: 'USA',
    }

    it('checks guest update permission', async () => {
      mockHouseholdRepo.belongsToWedding.mockResolvedValue(true)
      mockHouseholdRepo.update.mockResolvedValue({ id: householdId, ...addressData })

      await service.updateHouseholdAddress(authz, weddingId, householdId, addressData)

      expect(mockRequirePermission).toHaveBeenCalledWith(authz, { guest: ['update'] })
    })

    it('validates household belongs to wedding', async () => {
      mockHouseholdRepo.belongsToWedding.mockResolvedValue(true)
      mockHouseholdRepo.update.mockResolvedValue({ id: householdId, ...addressData })

      await service.updateHouseholdAddress(authz, weddingId, householdId, addressData)

      expect(mockHouseholdRepo.belongsToWedding).toHaveBeenCalledWith(householdId, weddingId)
    })

    it('delegates to householdRepo.update', async () => {
      mockHouseholdRepo.belongsToWedding.mockResolvedValue(true)
      const updatedHousehold = { id: householdId, weddingId, ...addressData }
      mockHouseholdRepo.update.mockResolvedValue(updatedHousehold)

      const result = await service.updateHouseholdAddress(
        authz,
        weddingId,
        householdId,
        addressData
      )

      expect(mockHouseholdRepo.update).toHaveBeenCalledWith(householdId, addressData)
      expect(result).toEqual(updatedHousehold)
    })

    it('throws FORBIDDEN when household not in wedding', async () => {
      mockHouseholdRepo.belongsToWedding.mockResolvedValue(false)

      await expect(
        service.updateHouseholdAddress(authz, weddingId, householdId, addressData)
      ).rejects.toThrow(TRPCError)
    })
  })
})
