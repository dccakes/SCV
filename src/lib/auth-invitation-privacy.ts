import type { BetterAuthPlugin } from 'better-auth'
import { APIError, createAuthMiddleware, getSessionFromCtx } from 'better-auth/api'

import { organizationRoles } from '~/lib/auth-permissions'

/**
 * Better Auth's organization endpoints only check that the caller is a *member* before returning
 * pending invitations (invitee email, role, status). That includes the most restricted role, so
 * a viewer could read who has been invited by calling the API directly, even though the Settings
 * UI hides the list. This plugin enforces the same rule the UI uses: only roles that can create
 * invitations (owner, admin) may see them.
 *
 * Covered endpoints:
 * - /organization/list-invitations: rejected with FORBIDDEN.
 * - /organization/get-full-organization: the `invitations` array is emptied (the member list is
 *   still returned, since viewers are allowed to see who has access).
 */

const LIST_INVITATIONS_PATH = '/organization/list-invitations'
const FULL_ORGANIZATION_PATH = '/organization/get-full-organization'

type AuthorizeCallable = {
  authorize: (permissions: { invitation: string[] }) => { success: boolean }
}

/** Better Auth stores multiple roles as a comma separated string. Any role that may invite wins. */
export function canViewOrganizationInvitations(role: string | null | undefined): boolean {
  if (!role) {
    return false
  }

  return role
    .split(',')
    .map((entry) => entry.trim())
    .some((entry) => {
      if (!(entry in organizationRoles)) {
        return false
      }
      const roleDefinition = organizationRoles[
        entry as keyof typeof organizationRoles
      ] as unknown as AuthorizeCallable
      return roleDefinition.authorize({ invitation: ['create'] }).success
    })
}

type FullOrganizationBody = {
  members?: { userId?: string; role?: string }[]
  invitations?: unknown[]
}

export const invitationPrivacyPlugin = {
  id: 'invitation-privacy',
  hooks: {
    before: [
      {
        matcher: (context) => context.path === LIST_INVITATIONS_PATH,
        handler: createAuthMiddleware(async (ctx) => {
          const session = await getSessionFromCtx(ctx)
          if (!session) {
            // The endpoint itself answers unauthenticated callers.
            return
          }

          const query = (ctx.query ?? {}) as { organizationId?: string }
          const organizationId = query.organizationId || session.session.activeOrganizationId
          if (!organizationId) {
            return
          }

          const member = await ctx.context.adapter.findOne<{ role: string }>({
            model: 'member',
            where: [
              { field: 'organizationId', value: organizationId },
              { field: 'userId', value: session.user.id },
            ],
          })

          // Non-members are rejected by the endpoint. Members without invite rights are rejected here.
          if (member && !canViewOrganizationInvitations(member.role)) {
            throw new APIError('FORBIDDEN', {
              message: 'You do not have permission to view invitations',
            })
          }
        }),
      },
    ],
    after: [
      {
        matcher: (context) => context.path === FULL_ORGANIZATION_PATH,
        handler: createAuthMiddleware(async (ctx) => {
          const returned = ctx.context.returned as FullOrganizationBody | null | undefined
          if (!returned || typeof returned !== 'object' || !Array.isArray(returned.invitations)) {
            // Errors and empty results pass through untouched.
            return
          }

          const session = await getSessionFromCtx(ctx)
          const caller = session
            ? returned.members?.find((member) => member.userId === session.user.id)
            : undefined

          // Fail closed: if the caller can't be matched to a member, they don't get invitations.
          if (caller && canViewOrganizationInvitations(caller.role)) {
            return
          }

          return ctx.json({ ...returned, invitations: [] })
        }),
      },
    ],
  },
} satisfies BetterAuthPlugin
