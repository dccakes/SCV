import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { OrganizationMembersSettingsCard } from '~/components/settings/organization-members-settings-card'

const mockFetch = jest.fn()

jest.mock('~/lib/auth-client', () => ({
  authClient: {
    $fetch: (...args: unknown[]) => mockFetch(...args),
  },
}))

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}))

describe('OrganizationMembersSettingsCard', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('shows a loading state before organization data resolves', () => {
    mockFetch.mockImplementation(() => new Promise(() => undefined))

    render(<OrganizationMembersSettingsCard />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading organization members...')
    expect(screen.getByRole('button', { name: 'Invite Member' })).toBeDisabled()
  })

  it('renders the active organization members once the requests succeed', async () => {
    mockFetch.mockImplementation(
      (path: string, options?: { body?: { permissions?: Record<string, unknown> } }) => {
        const body = options?.body

        if (path === '/organization/get-full-organization') {
          return Promise.resolve({
            data: {
              id: 'org-seed-shrek-fiona',
              members: [
                {
                  id: 'member-fiona',
                  role: 'member',
                  user: { email: 'fiona@swamp.wed', name: 'Fiona Ogre' },
                },
                {
                  id: 'member-shrek',
                  role: 'owner',
                  user: { email: 'shrek@swamp.wed', name: 'Shrek Ogre' },
                },
              ],
              name: 'Couple',
            },
            error: null,
          })
        }

        if (path === '/organization/has-permission' && body?.permissions?.invitation) {
          return Promise.resolve({
            data: { success: true },
            error: null,
          })
        }

        if (path === '/organization/has-permission' && body?.permissions?.member) {
          return Promise.resolve({
            data: { success: true },
            error: null,
          })
        }

        throw new Error(`Unexpected fetch path: ${path}`)
      }
    )

    render(<OrganizationMembersSettingsCard />)

    await waitFor(() => {
      expect(screen.getByText('Shrek Ogre')).toBeInTheDocument()
    })

    expect(screen.getByText('fiona@swamp.wed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Invite Member' })).toBeEnabled()
    expect(screen.getAllByRole('button', { name: 'Edit Role' })).toHaveLength(2)
  })

  it('keeps inviting disabled without invitation:create even if member updates are allowed', async () => {
    mockFetch.mockImplementation(
      (path: string, options?: { body?: { permissions?: Record<string, unknown> } }) => {
        const body = options?.body

        if (path === '/organization/get-full-organization') {
          return Promise.resolve({
            data: {
              id: 'org-seed-shrek-fiona',
              members: [
                {
                  id: 'member-fiona',
                  role: 'member',
                  user: { email: 'fiona@swamp.wed', name: 'Fiona Ogre' },
                },
              ],
              name: 'Couple',
            },
            error: null,
          })
        }

        if (path === '/organization/has-permission' && body?.permissions?.invitation) {
          return Promise.resolve({
            data: { success: false },
            error: null,
          })
        }

        if (path === '/organization/has-permission' && body?.permissions?.member) {
          return Promise.resolve({
            data: { success: true },
            error: null,
          })
        }

        throw new Error(`Unexpected fetch path: ${path}`)
      }
    )

    render(<OrganizationMembersSettingsCard />)

    await waitFor(() => {
      expect(screen.getByText('Fiona Ogre')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: 'Invite Member' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Edit Role' })).toBeEnabled()
  })

  it('hides role editing without member:update even if inviting is allowed', async () => {
    mockFetch.mockImplementation(
      (path: string, options?: { body?: { permissions?: Record<string, unknown> } }) => {
        const body = options?.body

        if (path === '/organization/get-full-organization') {
          return Promise.resolve({
            data: {
              id: 'org-seed-shrek-fiona',
              members: [
                {
                  id: 'member-fiona',
                  role: 'member',
                  user: { email: 'fiona@swamp.wed', name: 'Fiona Ogre' },
                },
              ],
              name: 'Couple',
            },
            error: null,
          })
        }

        if (path === '/organization/has-permission' && body?.permissions?.invitation) {
          return Promise.resolve({
            data: { success: true },
            error: null,
          })
        }

        if (path === '/organization/has-permission' && body?.permissions?.member) {
          return Promise.resolve({
            data: { success: false },
            error: null,
          })
        }

        throw new Error(`Unexpected fetch path: ${path}`)
      }
    )

    render(<OrganizationMembersSettingsCard />)

    await waitFor(() => {
      expect(screen.getByText('Fiona Ogre')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: 'Invite Member' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Edit Role' })).not.toBeInTheDocument()
  })

  it('surfaces fetch failures with retry instead of staying pending forever', async () => {
    mockFetch.mockResolvedValue({
      data: null,
      error: { message: 'organization/list-invitations failed upstream' },
    })

    render(<OrganizationMembersSettingsCard />)

    await waitFor(() => {
      expect(screen.getByText('Unable to load organization members.')).toBeInTheDocument()
    })

    expect(screen.getByText('Unable to load organization.')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Retry' })).not.toHaveLength(0)
  })

  it('sends invitations only after the dialog is opened', async () => {
    mockFetch.mockImplementation(
      (path: string, options?: { body?: { permissions?: Record<string, unknown> } }) => {
        const body = options?.body

        if (path === '/organization/get-full-organization') {
          return Promise.resolve({
            data: {
              id: 'org-seed-shrek-fiona',
              members: [],
              name: 'Couple',
            },
            error: null,
          })
        }

        if (path === '/organization/has-permission' && body?.permissions?.invitation) {
          return Promise.resolve({
            data: { success: true },
            error: null,
          })
        }

        if (path === '/organization/has-permission' && body?.permissions?.member) {
          return Promise.resolve({
            data: { success: true },
            error: null,
          })
        }

        if (path === '/organization/invite-member') {
          return Promise.resolve({
            data: { id: 'invite-1' },
            error: null,
          })
        }

        throw new Error(`Unexpected fetch path: ${path}`)
      }
    )

    render(<OrganizationMembersSettingsCard />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Invite Member' })).toBeEnabled()
    })

    expect(mockFetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/organization/list-invitations'),
      expect.anything()
    )

    fireEvent.click(screen.getByRole('button', { name: 'Invite Member' }))
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'donkey@swamp.wed' },
    })
    fireEvent.change(screen.getByLabelText('Role'), {
      target: { value: 'viewer' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send Invite' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/organization/invite-member',
        expect.objectContaining({
          body: expect.objectContaining({
            email: 'donkey@swamp.wed',
            organizationId: 'org-seed-shrek-fiona',
            role: 'viewer',
          }),
          method: 'POST',
        })
      )
    })
  })

  it('updates a member role only when member:update is granted', async () => {
    mockFetch.mockImplementation(
      (path: string, options?: { body?: { permissions?: Record<string, unknown> } }) => {
        const body = options?.body

        if (path === '/organization/get-full-organization') {
          return Promise.resolve({
            data: {
              id: 'org-seed-shrek-fiona',
              members: [
                {
                  id: 'member-fiona',
                  role: 'member',
                  user: { email: 'fiona@swamp.wed', name: 'Fiona Ogre' },
                },
              ],
              name: 'Couple',
            },
            error: null,
          })
        }

        if (path === '/organization/has-permission' && body?.permissions?.invitation) {
          return Promise.resolve({
            data: { success: true },
            error: null,
          })
        }

        if (path === '/organization/has-permission' && body?.permissions?.member) {
          return Promise.resolve({
            data: { success: true },
            error: null,
          })
        }

        if (path === '/organization/update-member-role') {
          return Promise.resolve({
            data: { id: 'member-fiona', role: 'admin' },
            error: null,
          })
        }

        throw new Error(`Unexpected fetch path: ${path}`)
      }
    )

    render(<OrganizationMembersSettingsCard />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Edit Role' })).toBeEnabled()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Edit Role' }))
    fireEvent.change(screen.getByLabelText('Member Role'), {
      target: { value: 'admin' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save Role' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/organization/update-member-role',
        expect.objectContaining({
          body: expect.objectContaining({
            memberId: 'member-fiona',
            organizationId: 'org-seed-shrek-fiona',
            role: 'admin',
          }),
          method: 'POST',
        })
      )
    })
  })
})
