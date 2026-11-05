jest.mock('~/lib/auth-permissions', () => require('~/lib/__mocks__/auth-permissions'))
jest.mock('~/server/application/workspace/workspace-scope', () => ({
  resolveWorkspaceScope: jest.fn(),
}))

import { resolveWorkspaceScope } from '~/server/application/workspace/workspace-scope'
import { canEditActiveWorkspace } from '~/server/authz/editor-access'

const mockResolve = resolveWorkspaceScope as jest.Mock
const session = { user: { id: 'user-1' } }

describe('canEditActiveWorkspace', () => {
  it.each([
    ['owner', true],
    ['admin', true],
    ['member', true],
    ['viewer', false],
    ['mystery', false],
  ])('role %s -> %s', async (role, expected) => {
    mockResolve.mockResolvedValue({ activeOrganization: { organizationId: 'o', role } })
    await expect(canEditActiveWorkspace(session)).resolves.toBe(expected)
  })

  it('denies signed-out sessions without resolving scope', async () => {
    mockResolve.mockClear()
    await expect(canEditActiveWorkspace(null)).resolves.toBe(false)
    expect(mockResolve).not.toHaveBeenCalled()
  })
})
