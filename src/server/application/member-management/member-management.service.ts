import type { AuthzContext } from 'server/authz/authorization.types'
import { requirePermission } from 'server/authz/permission-checker'
import type { OrganizationRole } from '~/lib/auth-permissions'

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
    await this.assertHasOrganizationMemberPermission(ctx, input.organizationId, 'invite')
    return this.memberRepository.inviteMember(input)
  }

  async updateMemberRole(ctx: AuthzContext, input: UpdateMemberRoleCommand): Promise<unknown> {
    await this.assertHasOrganizationMemberPermission(ctx, input.organizationId, 'role_update')
    return this.memberRepository.updateMemberRole(input)
  }

  async removeMember(ctx: AuthzContext, input: RemoveMemberCommand): Promise<void> {
    await this.assertHasOrganizationMemberPermission(ctx, input.organizationId, 'remove')
    await this.memberRepository.removeMember(input)
  }

  private async assertHasOrganizationMemberPermission(
    ctx: AuthzContext,
    organizationId: string,
    action: OrganizationMemberAction
  ): Promise<void> {
    await requirePermission(
      ctx,
      {
        organization_member: [action],
      },
      {
        organizationId,
      }
    )
  }
}
