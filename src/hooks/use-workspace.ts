'use client'

import { api } from '~/trpc/react'

const fallbackWorkspace = {
  organizationId: null,
  weddingId: null,
  role: null,
  capabilities: {
    canInviteMembers: false,
    canManageMembers: false,
    canSendInvites: false,
    canViewPlanning: false,
  },
  enabledAddOns: [] as string[],
}

export function useWorkspace() {
  const query = api.wedding.getWorkspace.useQuery()

  return {
    ...query,
    workspace: query.data ?? fallbackWorkspace,
  }
}
