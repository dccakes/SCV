import { TRPCError } from '@trpc/server'

jest.mock('server/authz/permission-checker', () => ({
  requirePermission: jest.fn(),
}))

import { MemberManagementService } from 'server/application/member-management/member-management.service'
import { requirePermission } from 'server/authz/permission-checker'

const mockRequirePermission = requirePermission as jest.Mock

describe('MemberManagementService', () => {
  const mockMemberRepository = {
    inviteMember: jest.fn(),
    updateMemberRole: jest.fn(),
    removeMember: jest.fn(),
  }

  let service: MemberManagementService

  const actorContext = {
    userId: 'actor-1',
    activeOrganization: null,
  }

  beforeEach(() => {
    jest.resetAllMocks()
    service = new MemberManagementService(mockMemberRepository)
  })

  describe('inviteMember', () => {
    it('should invite member when actor can invite organization members', async () => {
      mockRequirePermission.mockReturnValue({ organizationId: 'org-1', role: 'admin' })
      const invitedMember = { id: 'member-1', email: 'new@example.com', role: 'editor' }
      mockMemberRepository.inviteMember.mockResolvedValue(invitedMember)

      const result = await service.inviteMember(actorContext, {
        organizationId: 'org-1',
        email: 'new@example.com',
        role: 'editor',
      })

      expect(result).toEqual(invitedMember)
      expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, {
        organization_member: ['invite'],
      })
    })

    it('should reject invite when actor cannot invite organization members', async () => {
      mockRequirePermission.mockImplementation(() => {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'forbidden' })
      })

      await expect(
        service.inviteMember(actorContext, {
          organizationId: 'org-1',
          email: 'new@example.com',
          role: 'editor',
        })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })

      expect(mockMemberRepository.inviteMember).not.toHaveBeenCalled()
    })
  })

  describe('updateMemberRole', () => {
    it('should update member role when actor can update roles', async () => {
      mockRequirePermission.mockReturnValue({ organizationId: 'org-1', role: 'admin' })
      const updatedMember = { id: 'member-1', role: 'owner' }
      mockMemberRepository.updateMemberRole.mockResolvedValue(updatedMember)

      const result = await service.updateMemberRole(actorContext, {
        organizationId: 'org-1',
        memberId: 'member-1',
        role: 'owner',
      })

      expect(result).toEqual(updatedMember)
      expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, {
        organization_member: ['role_update'],
      })
    })

    it('should reject role update when actor cannot update organization member roles', async () => {
      mockRequirePermission.mockImplementation(() => {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'forbidden' })
      })

      await expect(
        service.updateMemberRole(actorContext, {
          organizationId: 'org-1',
          memberId: 'member-1',
          role: 'owner',
        })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })

      expect(mockMemberRepository.updateMemberRole).not.toHaveBeenCalled()
    })
  })

  describe('removeMember', () => {
    it('should remove member when actor can remove organization members', async () => {
      mockRequirePermission.mockReturnValue({ organizationId: 'org-1', role: 'admin' })
      mockMemberRepository.removeMember.mockResolvedValue(undefined)

      await service.removeMember(actorContext, {
        organizationId: 'org-1',
        memberId: 'member-1',
      })

      expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, {
        organization_member: ['remove'],
      })
      expect(mockMemberRepository.removeMember).toHaveBeenCalledWith({
        organizationId: 'org-1',
        memberId: 'member-1',
      })
    })

    it('should reject remove when actor cannot remove organization members', async () => {
      mockRequirePermission.mockImplementation(() => {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'forbidden' })
      })

      await expect(
        service.removeMember(actorContext, {
          organizationId: 'org-1',
          memberId: 'member-1',
        })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })

      expect(mockMemberRepository.removeMember).not.toHaveBeenCalled()
    })
  })
})
