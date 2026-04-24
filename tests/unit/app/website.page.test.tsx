import { render, screen } from '@testing-library/react'

import WebsitePage from '~/app/(authenicated)/website/page'

const mockGetRequiredWedding = jest.fn()
const mockGetWebsiteByUserId = jest.fn()
const mockCreateWebsite = jest.fn()
const mockGetHomeSection = jest.fn()
const mockDashboardTopbar = jest.fn(() => <header data-testid='dashboard-topbar'>Topbar</header>)
const mockWebsiteDisabledCallout = jest.fn(() => (
  <div data-testid='website-disabled-callout'>Disabled callout</div>
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
      create: (input: Record<string, never>) => mockCreateWebsite(input),
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

jest.mock('~/app/_components/website/website-editor', () => ({
  __esModule: true,
  WebsiteEditor: (props: { publicUrl: string; websiteId: string; initialIntroText: string }) =>
    mockWebsiteEditor(props),
}))

describe('WebsitePage', () => {
  beforeEach(() => {
    mockGetRequiredWedding.mockReset()
    mockGetWebsiteByUserId.mockReset()
    mockCreateWebsite.mockReset()
    mockGetHomeSection.mockReset()
    mockDashboardTopbar.mockClear()
    mockWebsiteDisabledCallout.mockClear()
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
    expect(mockCreateWebsite).not.toHaveBeenCalled()
  })

  it('auto-creates a website and renders the editor when the plugin is enabled', async () => {
    mockGetRequiredWedding.mockResolvedValue({
      id: 'wedding-123',
      enabledAddOns: ['website_builder'],
    })
    mockGetWebsiteByUserId.mockResolvedValue(null)
    mockCreateWebsite.mockResolvedValue({
      id: 'website-123',
      subUrl: 'janeandjohn',
    })

    const page = await WebsitePage()
    render(page)

    expect(mockCreateWebsite).toHaveBeenCalledWith({})
    expect(screen.getByTestId('website-editor')).toBeInTheDocument()
    expect(mockWebsiteEditor).toHaveBeenCalledWith({
      publicUrl: 'http://localhost:3000/w/janeandjohn',
      websiteId: 'website-123',
      initialIntroText: '',
    })
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

    expect(mockCreateWebsite).not.toHaveBeenCalled()
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
