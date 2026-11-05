import { render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { PluginsSettingsCard } from '~/app/_components/settings/plugins-settings-card'
import { WorkspaceCapabilitiesProvider } from '~/components/contexts/workspace-capabilities-context'
import WeddingSettingsForm from '~/components/forms/wedding-settings-form'
import { OrganizationMembersSettingsCard } from '~/components/settings/organization-members-settings-card'

const mockFetch = jest.fn()

jest.mock('~/lib/auth-client', () => ({
  authClient: { $fetch: (...args: unknown[]) => mockFetch(...args) },
}))
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }))
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn() }) }))
jest.mock('~/trpc/react', () => ({
  api: {
    useUtils: () => ({
      dashboard: { getForActiveWorkspace: { invalidate: jest.fn() } },
      wedding: { getDetails: { invalidate: jest.fn() } },
    }),
    wedding: {
      updateDetails: { useMutation: () => ({ mutate: jest.fn(), isPending: false }) },
      toggleAddOn: { useMutation: () => ({ mutate: jest.fn(), isPending: false }) },
    },
  },
}))

const wrap = (canEditPlanning: boolean, node: ReactNode) => (
  <WorkspaceCapabilitiesProvider canEditPlanning={canEditPlanning}>
    {node}
  </WorkspaceCapabilitiesProvider>
)

const initialData = {
  groomFirstName: 'Shrek',
  groomLastName: 'Ogre',
  brideFirstName: 'Fiona',
  brideLastName: 'Ogre',
}

describe('WeddingSettingsForm', () => {
  it('lets editors save', () => {
    render(wrap(true, <WeddingSettingsForm initialData={initialData} />))
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument()
    expect(screen.getByLabelText('First Name', { selector: '#groomFirstName' })).toBeEnabled()
  })

  it('is read-only for viewers', () => {
    render(wrap(false, <WeddingSettingsForm initialData={initialData} />))
    expect(screen.queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument()
    expect(screen.getByDisplayValue('Shrek')).toBeDisabled()
  })
})

describe('PluginsSettingsCard', () => {
  it('shows a toggle for editors', () => {
    render(wrap(true, <PluginsSettingsCard enabledAddOns={['website_builder']} />))
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('shows read-only state for viewers', () => {
    render(wrap(false, <PluginsSettingsCard enabledAddOns={['website_builder']} />))
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    expect(screen.getByText('Enabled')).toBeInTheDocument()
  })
})

describe('OrganizationMembersSettingsCard for viewers', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockImplementation((path: string) => {
      if (path === '/organization/get-full-organization') {
        return Promise.resolve({
          data: {
            id: 'org-1',
            members: [
              { id: 'm1', role: 'owner', user: { email: 'shrek@swamp.wed', name: 'Shrek Ogre' } },
            ],
          },
          error: null,
        })
      }
      if (path === '/organization/has-permission') {
        return Promise.resolve({ data: { success: false }, error: null })
      }
      return Promise.resolve({
        data: [{ id: 'i1', email: 'x@y.z', status: 'pending', role: 'member' }],
        error: null,
      })
    })
  })

  it('lists members without any write controls', async () => {
    render(wrap(false, <OrganizationMembersSettingsCard />))
    await waitFor(() => expect(screen.getByText('Shrek Ogre')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Invite Member' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit Role' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument()
    expect(screen.queryByText('Pending Invitations')).not.toBeInTheDocument()
    expect(screen.getByText(/view-only access/)).toBeInTheDocument()
  })
})
