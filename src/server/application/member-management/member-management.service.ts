import { TRPCError } from '@trpc/server'

import type { OrganizationRole } from '~/lib/auth-permissions'
import type { ActiveOrganization, AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'

export type OrganizationMemberAction = 'invite' | 'role_update' | 'remove'

export type InviteMemberCommand = {
  organizationId: string
  email: string
  role: OrganizationRole
}

export type UpdateMemberRoleCommand = {
  organizationId: string
  memberId: string
  role: OrganizationRole
}

export type RemoveMemberCommand = {
  organizationId: string
  memberId: string
}

export interface MemberManagementRepository {
  inviteMember(input: InviteMemberCommand): Promise<unknown>
  updateMemberRole(input: UpdateMemberRoleCommand): Promise<unknown>
  removeMember(input: RemoveMemberCommand): Promise<void>
}

export class MemberManagementService {
  constructor(private readonly memberRepository: MemberManagementRepository) {}

  async inviteMember(ctx: AuthzContext, input: InviteMemberCommand): Promise<unknown> {
    const activeOrg = this.assertHasOrganizationMemberPermission(ctx, 'invite')
    this.assertOrganizationScope(activeOrg.organizationId, input.organizationId)
    return this.memberRepository.inviteMember(input)
  }

  async updateMemberRole(ctx: AuthzContext, input: UpdateMemberRoleCommand): Promise<unknown> {
    const activeOrg = this.assertHasOrganizationMemberPermission(ctx, 'role_update')
    this.assertOrganizationScope(activeOrg.organizationId, input.organizationId)
    return this.memberRepository.updateMemberRole(input)
  }

  async removeMember(ctx: AuthzContext, input: RemoveMemberCommand): Promise<void> {
    const activeOrg = this.assertHasOrganizationMemberPermission(ctx, 'remove')
    this.assertOrganizationScope(activeOrg.organizationId, input.organizationId)
    await this.memberRepository.removeMember(input)
  }

  private assertOrganizationScope(activeOrgId: string, inputOrgId: string): void {
    if (activeOrgId !== inputOrgId) {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }
  }

  private assertHasOrganizationMemberPermission(
    ctx: AuthzContext,
    action: OrganizationMemberAction
  ): ActiveOrganization {
    return requirePermission(ctx, { organization_member: [action] })
  }
}
