import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { OrganizationOutstandingInvitesCard } from '~/components/settings/organization-outstanding-invites-card'

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

describe('OrganizationOutstandingInvitesCard', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('renders nothing before initial invitation requests resolve', () => {
    mockFetch.mockImplementation(() => new Promise(() => undefined))

    const { container } = render(<OrganizationOutstandingInvitesCard />)

    expect(container).toBeEmptyDOMElement()
  })

  it('stays hidden when invitation:create permission is missing', async () => {
    mockFetch.mockImplementation(
      (path: string, options?: { body?: { permissions?: Record<string, string[]> } }) => {
        const body = options?.body

        if (path === '/organization/get-full-organization') {
          return Promise.resolve({
            data: {
              id: 'org-seed-shrek-fiona',
            },
            error: null,
          })
        }

        if (
          path === '/organization/has-permission' &&
          body?.permissions?.invitation?.[0] === 'create'
        ) {
          return Promise.resolve({
            data: { success: false },
            error: null,
          })
        }

        if (
          path === '/organization/has-permission' &&
          body?.permissions?.invitation?.[0] === 'cancel'
        ) {
          return Promise.resolve({
            data: { success: true },
            error: null,
          })
        }

        throw new Error(`Unexpected fetch path: ${path}`)
      }
    )

    render(<OrganizationOutstandingInvitesCard />)

    await waitFor(() => {
      expect(screen.queryByText('Outstanding Invites')).not.toBeInTheDocument()
    })
  })

  it('renders only pending unexpired invites and supports resend/cancel actions', async () => {
    mockFetch.mockImplementation(
      (
        path: string,
        options?: { body?: Record<string, unknown> & { permissions?: Record<string, string[]> } }
      ) => {
        const body = options?.body

        if (path === '/organization/get-full-organization') {
          return Promise.resolve({
            data: {
              id: 'org-seed-shrek-fiona',
            },
            error: null,
          })
        }

        if (
          path === '/organization/has-permission' &&
          body?.permissions?.invitation?.[0] === 'create'
        ) {
          return Promise.resolve({
            data: { success: true },
            error: null,
          })
        }

        if (
          path === '/organization/has-permission' &&
          body?.permissions?.invitation?.[0] === 'cancel'
        ) {
          return Promise.resolve({
            data: { success: true },
            error: null,
          })
        }

        if (path === '/organization/list-invitations') {
          return Promise.resolve({
            data: [
              {
                createdAt: '2026-04-06T12:00:00.000Z',
                email: 'pending@example.com',
                expiresAt: '2099-04-10T10:00:00.000Z',
                id: 'invite-pending',
                role: 'member',
                status: 'pending',
              },
              {
                createdAt: '2026-04-05T12:00:00.000Z',
                email: 'expired@example.com',
                expiresAt: '2026-04-01T10:00:00.000Z',
                id: 'invite-expired',
                role: 'viewer',
                status: 'pending',
              },
              {
                createdAt: '2026-04-04T12:00:00.000Z',
                email: 'accepted@example.com',
                expiresAt: '2099-04-10T10:00:00.000Z',
                id: 'invite-accepted',
                role: 'admin',
                status: 'accepted',
              },
            ],
            error: null,
          })
        }

        if (path === '/organization/invite-member') {
          return Promise.resolve({
            data: { id: 'invite-pending' },
            error: null,
          })
        }

        if (path === '/organization/cancel-invitation') {
          return Promise.resolve({
            data: { id: 'invite-pending', status: 'canceled' },
            error: null,
          })
        }

        throw new Error(`Unexpected fetch path: ${path}`)
      }
    )

    render(<OrganizationOutstandingInvitesCard />)

    await waitFor(() => {
      expect(screen.getByText('pending@example.com')).toBeInTheDocument()
    })

    expect(screen.queryByText('accepted@example.com')).not.toBeInTheDocument()
    expect(screen.queryByText('expired@example.com')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Resend' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/organization/invite-member',
        expect.objectContaining({
          body: expect.objectContaining({
            email: 'pending@example.com',
            organizationId: 'org-seed-shrek-fiona',
            resend: true,
          }),
          method: 'POST',
        })
      )
      expect(mockFetch).toHaveBeenCalledWith(
        '/organization/cancel-invitation',
        expect.objectContaining({
          body: expect.objectContaining({
            invitationId: 'invite-pending',
          }),
          method: 'POST',
        })
      )
    })
  })

  it('disables cancel action when invitation:cancel permission is missing', async () => {
    mockFetch.mockImplementation(
      (path: string, options?: { body?: { permissions?: Record<string, string[]> } }) => {
        const body = options?.body

        if (path === '/organization/get-full-organization') {
          return Promise.resolve({
            data: {
              id: 'org-seed-shrek-fiona',
            },
            error: null,
          })
        }

        if (
          path === '/organization/has-permission' &&
          body?.permissions?.invitation?.[0] === 'create'
        ) {
          return Promise.resolve({
            data: { success: true },
            error: null,
          })
        }

        if (
          path === '/organization/has-permission' &&
          body?.permissions?.invitation?.[0] === 'cancel'
        ) {
          return Promise.resolve({
            data: { success: false },
            error: null,
          })
        }

        if (path === '/organization/list-invitations') {
          return Promise.resolve({
            data: [
              {
                createdAt: '2026-04-06T12:00:00.000Z',
                email: 'pending@example.com',
                expiresAt: '2099-04-10T10:00:00.000Z',
                id: 'invite-pending',
                role: 'member',
                status: 'pending',
              },
            ],
            error: null,
          })
        }

        throw new Error(`Unexpected fetch path: ${path}`)
      }
    )

    render(<OrganizationOutstandingInvitesCard />)

    await waitFor(() => {
      expect(screen.getByText('pending@example.com')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(
      screen.getByText('Your role can resend invitations but cannot cancel them.')
    ).toBeInTheDocument()
  })
})
