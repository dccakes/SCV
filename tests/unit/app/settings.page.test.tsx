import { render, screen } from '@testing-library/react'

import SettingsPage from '~/app/(authenicated)/settings/page'

const mockGetDetails = jest.fn()
const mockGetRequiredWedding = jest.fn()
const mockDashboardTopbar = jest.fn(
  (_props: { title?: string; showManagementActions?: boolean }) => (
    <header data-testid='dashboard-topbar'>Topbar</header>
  )
)
const mockWeddingSettingsForm = jest.fn((_props: { initialData: Record<string, unknown> }) => (
  <div data-testid='wedding-settings-form'>Wedding form</div>
))
const mockOrganizationMembersSettingsCard = jest.fn(() => (
  <div data-testid='organization-members-settings-card'>Members card</div>
))
const mockOrganizationOutstandingInvitesCard = jest.fn(() => (
  <div data-testid='organization-outstanding-invites-card'>Outstanding invites card</div>
))
const mockPluginsSettingsCard = jest.fn((_props: { enabledAddOns: string[] }) => (
  <div data-testid='plugins-settings-card'>Plugins card</div>
))
const mockTelegramConnectCard = jest.fn(() => (
  <div data-testid='telegram-connect-card'>Telegram card</div>
))

jest.mock('~/trpc/server', () => ({
  api: {
    wedding: {
      getDetails: () => mockGetDetails(),
      getActive: jest.fn().mockResolvedValue({
        id: 'wedding-123',
        enabledAddOns: ['website_builder'],
      }),
    },
  },
}))

jest.mock('~/server/application/authenticated-route/authenticated-route-data', () => ({
  getRequiredWedding: () => mockGetRequiredWedding(),
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

jest.mock('~/components/settings/organization-members-settings-card', () => ({
  __esModule: true,
  OrganizationMembersSettingsCard: () => mockOrganizationMembersSettingsCard(),
}))

jest.mock('~/components/settings/organization-outstanding-invites-card', () => ({
  __esModule: true,
  OrganizationOutstandingInvitesCard: () => mockOrganizationOutstandingInvitesCard(),
}))

jest.mock('~/app/_components/settings/plugins-settings-card', () => ({
  __esModule: true,
  PluginsSettingsCard: (props: { enabledAddOns: string[] }) => mockPluginsSettingsCard(props),
}))

jest.mock('~/components/settings/telegram-connect-card', () => ({
  __esModule: true,
  TelegramConnectCard: () => mockTelegramConnectCard(),
}))

describe('SettingsPage', () => {
  beforeEach(() => {
    mockGetDetails.mockReset()
    mockGetRequiredWedding.mockReset()
    mockGetRequiredWedding.mockResolvedValue({
      id: 'wedding-123',
      enabledAddOns: ['website_builder'],
    })
    mockDashboardTopbar.mockClear()
    mockWeddingSettingsForm.mockClear()
    mockOrganizationMembersSettingsCard.mockClear()
    mockOrganizationOutstandingInvitesCard.mockClear()
    mockPluginsSettingsCard.mockClear()
    mockTelegramConnectCard.mockClear()
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
    expect(screen.getByText('Plugins')).toBeInTheDocument()
    expect(screen.getByTestId('wedding-settings-form')).toBeInTheDocument()
    expect(screen.getByTestId('plugins-settings-card')).toBeInTheDocument()
    expect(screen.getByTestId('organization-members-settings-card')).toBeInTheDocument()
    expect(screen.getByTestId('organization-outstanding-invites-card')).toBeInTheDocument()
    expect(screen.getByTestId('telegram-connect-card')).toBeInTheDocument()
  })

  it('still renders organization members when wedding details query fails', async () => {
    mockGetDetails.mockRejectedValue(new Error('No wedding'))

    const page = await SettingsPage()
    render(page)

    expect(
      screen.getByText('Unable to load wedding details for the active workspace.')
    ).toBeInTheDocument()
    expect(mockWeddingSettingsForm).not.toHaveBeenCalled()
    expect(mockOrganizationMembersSettingsCard).toHaveBeenCalledTimes(1)
    expect(mockOrganizationOutstandingInvitesCard).toHaveBeenCalledTimes(1)
    expect(mockTelegramConnectCard).toHaveBeenCalledTimes(1)
  })
})
