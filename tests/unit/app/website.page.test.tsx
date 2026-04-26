import { render, screen } from '@testing-library/react'

import WebsitePage from '~/app/(authenicated)/website/page'

const mockGetRequiredWedding = jest.fn()
const mockGetWebsiteByUserId = jest.fn()
const mockGetHomeSection = jest.fn()
const mockDashboardTopbar = jest.fn(() => <header data-testid='dashboard-topbar'>Topbar</header>)
const mockWebsiteDisabledCallout = jest.fn(() => (
  <div data-testid='website-disabled-callout'>Disabled callout</div>
))
const mockWebsiteSetupCallout = jest.fn(() => (
  <div data-testid='website-setup-callout'>Setup callout</div>
))
const mockWebsiteEditor = jest.fn(
  (_props: { publicUrl: string; websiteId: string; initialIntroText: string }) => (
    <div data-testid='website-editor'>Editor</div>
  )
)

jest.mock('~/trpc/server', () => ({
  api: {
    website: {
      getByUserId: () => mockGetWebsiteByUserId(),
    },
    websiteSection: {
      getHomeSection: () => mockGetHomeSection(),
    },
  },
}))

jest.mock('~/server/application/authenticated-route/authenticated-route-data', () => ({
  getRequiredWedding: () => mockGetRequiredWedding(),
}))

jest.mock('@/components/dashboard/dashboard-topbar', () => ({
  __esModule: true,
  default: () => mockDashboardTopbar(),
}))

jest.mock('~/app/_components/website/website-disabled-callout', () => ({
  __esModule: true,
  WebsiteDisabledCallout: () => mockWebsiteDisabledCallout(),
}))

jest.mock('~/app/_components/website/website-setup-callout', () => ({
  __esModule: true,
  WebsiteSetupCallout: () => mockWebsiteSetupCallout(),
}))

jest.mock('~/app/_components/website/website-editor', () => ({
  __esModule: true,
  WebsiteEditor: (props: { publicUrl: string; websiteId: string; initialIntroText: string }) =>
    mockWebsiteEditor(props),
}))

describe('WebsitePage', () => {
  beforeEach(() => {
    mockGetRequiredWedding.mockReset()
    mockGetWebsiteByUserId.mockReset()
    mockGetHomeSection.mockReset()
    mockDashboardTopbar.mockClear()
    mockWebsiteDisabledCallout.mockClear()
    mockWebsiteSetupCallout.mockClear()
    mockWebsiteEditor.mockClear()
    mockGetHomeSection.mockResolvedValue(null)

    mockGetRequiredWedding.mockResolvedValue({
      id: 'wedding-123',
      enabledAddOns: [],
    })
  })

  it('renders the disabled callout when website_builder is not enabled', async () => {
    mockGetRequiredWedding.mockResolvedValue({
      id: 'wedding-123',
      enabledAddOns: [],
    })

    const page = await WebsitePage()
    render(page)

    expect(screen.getByTestId('dashboard-topbar')).toBeInTheDocument()
    expect(screen.getByTestId('website-disabled-callout')).toBeInTheDocument()
    expect(mockWebsiteEditor).not.toHaveBeenCalled()
  })

  it('renders the setup callout when the plugin is enabled but no website exists yet', async () => {
    mockGetRequiredWedding.mockResolvedValue({
      id: 'wedding-123',
      enabledAddOns: ['website_builder'],
    })
    mockGetWebsiteByUserId.mockResolvedValue(null)

    const page = await WebsitePage()
    render(page)

    expect(screen.getByTestId('website-setup-callout')).toBeInTheDocument()
    expect(mockWebsiteEditor).not.toHaveBeenCalled()
  })

  it('reuses the existing website when one already exists', async () => {
    mockGetRequiredWedding.mockResolvedValue({
      id: 'wedding-123',
      enabledAddOns: ['website_builder'],
    })
    mockGetWebsiteByUserId.mockResolvedValue({
      id: 'website-789',
      subUrl: 'existing-site',
    })

    const page = await WebsitePage()
    render(page)

    expect(mockWebsiteEditor).toHaveBeenCalledWith({
      publicUrl: 'http://localhost:3000/w/existing-site',
      websiteId: 'website-789',
      initialIntroText: '',
    })
  })

  it('loads the existing HOME intro text into the editor', async () => {
    mockGetRequiredWedding.mockResolvedValue({
      id: 'wedding-123',
      enabledAddOns: ['website_builder'],
    })
    mockGetWebsiteByUserId.mockResolvedValue({
      id: 'website-789',
      subUrl: 'existing-site',
    })
    mockGetHomeSection.mockResolvedValue({
      id: 'section-123',
      content: {
        introText: 'Welcome to our wedding weekend.',
      },
    })

    const page = await WebsitePage()
    render(page)

    expect(mockWebsiteEditor).toHaveBeenCalledWith({
      publicUrl: 'http://localhost:3000/w/existing-site',
      websiteId: 'website-789',
      initialIntroText: 'Welcome to our wedding weekend.',
    })
  })
})
