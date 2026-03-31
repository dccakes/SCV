import type { OrganizationRole } from '~/lib/auth-permissions'
import type { AuthzContext } from '~/server/authz/authorization.types'
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
    this.assertHasOrganizationMemberPermission(ctx, 'invite')
    return this.memberRepository.inviteMember(input)
  }

  async updateMemberRole(ctx: AuthzContext, input: UpdateMemberRoleCommand): Promise<unknown> {
    this.assertHasOrganizationMemberPermission(ctx, 'role_update')
    return this.memberRepository.updateMemberRole(input)
  }

  async removeMember(ctx: AuthzContext, input: RemoveMemberCommand): Promise<void> {
    this.assertHasOrganizationMemberPermission(ctx, 'remove')
    await this.memberRepository.removeMember(input)
  }

  private assertHasOrganizationMemberPermission(
    ctx: AuthzContext,
    action: OrganizationMemberAction
  ): void {
    requirePermission(ctx, { organization_member: [action] })
  }
}
