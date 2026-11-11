jest.mock('~/lib/auth-permissions', () => require('~/lib/__mocks__/auth-permissions'))

const mockGetSession = jest.fn()
const mockResolveWorkspaceScope = jest.fn()
const mockGetDetails = jest.fn()
const mockGetActive = jest.fn()
const mockRedirect = jest.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`)
})
const mockShellProps = jest.fn()

jest.mock('next/headers', () => ({ headers: jest.fn().mockResolvedValue(new Headers()) }))
jest.mock('next/navigation', () => ({ redirect: (path: string) => mockRedirect(path) }))
jest.mock('~/lib/auth', () => ({ auth: { api: { getSession: () => mockGetSession() } } }))
jest.mock('~/server/application/workspace/workspace-scope', () => ({
  resolveWorkspaceScope: (input: unknown) => mockResolveWorkspaceScope(input),
}))
jest.mock('~/trpc/server', () => ({
  api: {
    wedding: { getDetails: () => mockGetDetails(), getActive: () => mockGetActive() },
  },
}))
jest.mock('~/components/layout/authenticated-app-shell', () => ({
  __esModule: true,
  default: (props: unknown) => {
    mockShellProps(props)
    return null
  },
}))

import { AuthenticatedLayoutFrame } from '~/components/layout/authenticated-layout-frame'

const withRole = (role: string | null) => {
  mockGetSession.mockResolvedValue({ user: { id: 'user-1', name: 'Q', email: 'q@x.test' } })
  mockResolveWorkspaceScope.mockResolvedValue({
    activeOrganization: role ? { organizationId: 'org-1', role } : null,
    activeWeddingId: 'wedding-1',
  })
}

const renderFrame = async (showEttaPanel = true) => {
  const element = await AuthenticatedLayoutFrame({ children: null, showEttaPanel })
  return element
}

describe('AuthenticatedLayoutFrame access', () => {
  beforeEach(() => {
    mockRedirect.mockClear()
    mockShellProps.mockClear()
    mockGetDetails.mockResolvedValue(null)
    mockGetActive.mockResolvedValue({ id: 'wedding-1' })
  })

  it('redirects signed-out users to sign in', async () => {
    mockGetSession.mockResolvedValue(null)

    await expect(renderFrame()).rejects.toThrow('NEXT_REDIRECT:/auth/sign-in')
  })

  it.each(['owner', 'admin', 'member'])('lets %s in with edit access and Etta', async (role) => {
    withRole(role)

    const element = (await renderFrame()) as { props: Record<string, unknown> }

    expect(mockRedirect).not.toHaveBeenCalled()
    expect(element.props).toMatchObject({ canEditPlanning: true, showEttaPanel: true })
  })

  it('lets a viewer into the app (including Settings) read-only, without Etta', async () => {
    withRole('viewer')

    const element = (await renderFrame()) as { props: Record<string, unknown> }

    expect(mockRedirect).not.toHaveBeenCalled()
    expect(element.props).toMatchObject({ canEditPlanning: false, showEttaPanel: false })
    expect(mockGetActive).not.toHaveBeenCalled()
  })

  it.each([
    ['an unrecognised role', 'legacy-editor'],
    ['no active organization', null],
  ])('still sends %s to the homepage', async (_label, role) => {
    withRole(role)

    await expect(renderFrame()).rejects.toThrow('NEXT_REDIRECT:/')
  })
})
