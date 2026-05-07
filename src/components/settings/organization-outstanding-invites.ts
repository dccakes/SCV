export type OrganizationInvitation = {
  createdAt: string
  email: string
  expiresAt: string
  id: string
  organizationId?: string
  role: string
  status: string
}

export function getOutstandingInvitations(
  invitations: OrganizationInvitation[],
  now: Date = new Date()
): OrganizationInvitation[] {
  return invitations
    .filter((invitation) => {
      if (invitation.status !== 'pending') {
        return false
      }
      return new Date(invitation.expiresAt).getTime() > now.getTime()
    })
    .sort((left, right) => {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    })
}
