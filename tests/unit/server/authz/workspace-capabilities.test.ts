jest.mock('~/lib/auth-permissions', () => require('~/lib/__mocks__/auth-permissions'))

import { readWorkspaceCapabilities } from '~/server/authz/workspace-capabilities'

describe('readWorkspaceCapabilities', () => {
  it('returns no capabilities for null/unknown roles', () => {
    expect(readWorkspaceCapabilities(null)).toEqual({
      canInviteMembers: false,
      canManageMembers: false,
      canSendInvites: false,
      canViewPlanning: false,
    })
    expect(readWorkspaceCapabilities('nonexistent-role')).toEqual({
      canInviteMembers: false,
      canManageMembers: false,
      canSendInvites: false,
      canViewPlanning: false,
    })
  })

  it('returns full member-management and planning capabilities for owner/admin', () => {
    expect(readWorkspaceCapabilities('owner')).toEqual({
      canInviteMembers: true,
      canManageMembers: true,
      canSendInvites: true,
      canViewPlanning: true,
    })
    expect(readWorkspaceCapabilities('admin')).toEqual({
      canInviteMembers: true,
      canManageMembers: true,
      canSendInvites: true,
      canViewPlanning: true,
    })
  })

  it('keeps member restricted from outbound and org-management actions', () => {
    expect(readWorkspaceCapabilities('member')).toEqual({
      canInviteMembers: false,
      canManageMembers: false,
      canSendInvites: false,
      canViewPlanning: true,
    })
  })

  it('keeps viewer blocked from planning', () => {
    expect(readWorkspaceCapabilities('viewer')).toEqual({
      canInviteMembers: false,
      canManageMembers: false,
      canSendInvites: false,
      canViewPlanning: false,
    })
  })
})
