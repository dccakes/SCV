import type { Domain } from '~/lib/etta/types'
import type { AuthzContext, PermissionInput } from '~/server/authz/authorization.types'
import { hasPermission, requirePermission } from '~/server/authz/permission-checker'

const suggestionReadPermissions: Record<Domain, PermissionInput> = {
  guests: { guest: ['read'] },
  events: { event: ['read'] },
  rsvp: { rsvp: ['read_responses'] },
  vendors: { vendor: ['read'] },
  budget: { wedding: ['read'] },
  tasks: { wedding: ['read'] },
  other: { wedding: ['read'] },
}

export function requireSuggestionReviewPermission(authz: AuthzContext): void {
  requirePermission(authz, { wedding: ['update'] })
}

export function requireSuggestionDomainReadPermission(authz: AuthzContext, domain: Domain): void {
  requirePermission(authz, suggestionReadPermissions[domain])
}

export function getReadableSuggestionDomains(authz: AuthzContext): Domain[] {
  return Object.keys(suggestionReadPermissions).filter((domain) =>
    hasPermission(authz, suggestionReadPermissions[domain as Domain])
  ) as Domain[]
}
