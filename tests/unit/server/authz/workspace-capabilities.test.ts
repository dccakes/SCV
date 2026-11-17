jest.mock('~/lib/auth-permissions', () => require('~/lib/__mocks__/auth-permissions'))

import { readWorkspaceCapabilities, resolveHomeView } from '~/server/authz/workspace-capabilities'

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

describe('resolveHomeView', () => {
  it('shows marketing to signed-out visitors', () => {
    expect(
      resolveHomeView({ signedIn: false, activeOrganization: null, hasWeddingLink: false })
    ).toBe('marketing')
  })

  it('sends signed-in users without a workspace to onboarding, not marketing', () => {
    // Self-signup: a fresh account has no workspace until it creates its wedding.
    expect(
      resolveHomeView({ signedIn: true, activeOrganization: null, hasWeddingLink: false })
    ).toBe('app')
  })

  it('lets members who can view planning into the app', () => {
    expect(
      resolveHomeView({
        signedIn: true,
        activeOrganization: { organizationId: 'o', role: 'owner' },
        hasWeddingLink: true,
      })
    ).toBe('app')
  })

  it('keeps members without planning access (viewers) on marketing', () => {
    expect(
      resolveHomeView({
        signedIn: true,
        activeOrganization: { organizationId: 'o', role: 'viewer' },
        hasWeddingLink: false,
      })
    ).toBe('marketing')
  })

  it('keeps removed members with a leftover wedding link on marketing, not a form that would fail', () => {
    // Removing a member deletes the membership but not the legacy UserWedding link,
    // and wedding creation refuses users who already have one.
    expect(
      resolveHomeView({ signedIn: true, activeOrganization: null, hasWeddingLink: true })
    ).toBe('marketing')
  })
})
