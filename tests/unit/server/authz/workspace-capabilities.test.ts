jest.mock('~/lib/auth-permissions', () => require('~/lib/__mocks__/auth-permissions'))

import { readWorkspaceCapabilities } from '~/server/authz/workspace-capabilities'

describe('readWorkspaceCapabilities', () => {
  it('returns no capabilities for null/unknown roles', () => {
    expect(readWorkspaceCapabilities(null)).toEqual({
      canInviteMembers: false,
      canManageMembers: false,
      canSendInvites: false,
      canViewPlanning: false,
      canEditPlanning: false,
    })
    expect(readWorkspaceCapabilities('nonexistent-role')).toEqual({
      canInviteMembers: false,
      canManageMembers: false,
      canSendInvites: false,
      canViewPlanning: false,
      canEditPlanning: false,
    })
  })

  it('returns full member-management and planning capabilities for owner/admin', () => {
    expect(readWorkspaceCapabilities('owner')).toEqual({
      canInviteMembers: true,
      canManageMembers: true,
      canSendInvites: true,
      canViewPlanning: true,
      canEditPlanning: true,
    })
    expect(readWorkspaceCapabilities('admin')).toEqual({
      canInviteMembers: true,
      canManageMembers: true,
      canSendInvites: true,
      canViewPlanning: true,
      canEditPlanning: true,
    })
  })

  it('keeps member restricted from outbound and org-management actions', () => {
    expect(readWorkspaceCapabilities('member')).toEqual({
      canInviteMembers: false,
      canManageMembers: false,
      canSendInvites: false,
      canViewPlanning: true,
      canEditPlanning: true,
    })
  })

  it('gives viewer read access to planning but no edit, invite, or member capabilities', () => {
    expect(readWorkspaceCapabilities('viewer')).toEqual({
      canInviteMembers: false,
      canManageMembers: false,
      canSendInvites: false,
      canViewPlanning: true,
      canEditPlanning: false,
    })
  })
})
