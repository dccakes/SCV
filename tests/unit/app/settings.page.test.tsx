import { render, screen } from '@testing-library/react'

import SettingsPage from '~/app/(authenicated)/settings/page'

const mockGetDetails = jest.fn()
const mockDashboardTopbar = jest.fn(
  (_props: { title?: string; showManagementActions?: boolean }) => (
    <header data-testid='dashboard-topbar'>Topbar</header>
  )
)
const mockWeddingSettingsForm = jest.fn((_props: { initialData: Record<string, unknown> }) => (
  <div data-testid='wedding-settings-form'>Wedding form</div>
))
const mockOrganizationMembersReadOnlyCard = jest.fn(() => (
  <div data-testid='organization-members-readonly-card'>Members card</div>
))

jest.mock('~/trpc/server', () => ({
  api: {
    wedding: {
      getDetails: () => mockGetDetails(),
    },
  },
}))

jest.mock('@/components/dashboard/dashboard-topbar', () => ({
  __esModule: true,
  default: (props: { title?: string; showManagementActions?: boolean }) =>
    mockDashboardTopbar(props),
}))

jest.mock('~/components/forms/wedding-settings-form', () => ({
  __esModule: true,
  default: (props: { initialData: Record<string, unknown> }) => mockWeddingSettingsForm(props),
}))

jest.mock('~/components/settings/organization-members-readonly-card', () => ({
  __esModule: true,
  OrganizationMembersReadOnlyCard: () => mockOrganizationMembersReadOnlyCard(),
}))

describe('SettingsPage', () => {
  beforeEach(() => {
    mockGetDetails.mockReset()
    mockDashboardTopbar.mockClear()
    mockWeddingSettingsForm.mockClear()
    mockOrganizationMembersReadOnlyCard.mockClear()
  })

  it('renders wedding settings and organization members section when details exist', async () => {
    mockGetDetails.mockResolvedValue({
      groomFirstName: 'John',
      groomLastName: 'Doe',
      brideFirstName: 'Jane',
      brideLastName: 'Smith',
      weddingDate: '2026-04-01T00:00:00.000Z',
      weddingLocation: 'Beach Resort',
      primaryEventId: 'event-123',
    })

    const page = await SettingsPage()
    render(page)

    expect(mockDashboardTopbar).toHaveBeenCalledWith({
      title: 'Settings',
      showManagementActions: false,
    })
    expect(screen.getByText('Organization Members')).toBeInTheDocument()
    expect(screen.getByTestId('wedding-settings-form')).toBeInTheDocument()
    expect(screen.getByTestId('organization-members-readonly-card')).toBeInTheDocument()
  })

  it('renders onboarding fallback when details query fails', async () => {
    mockGetDetails.mockRejectedValue(new Error('No wedding'))

    const page = await SettingsPage()
    render(page)

    expect(
      screen.getByText('No wedding found. Please complete onboarding first.')
    ).toBeInTheDocument()
    expect(mockWeddingSettingsForm).not.toHaveBeenCalled()
    expect(mockOrganizationMembersReadOnlyCard).not.toHaveBeenCalled()
  })
})
