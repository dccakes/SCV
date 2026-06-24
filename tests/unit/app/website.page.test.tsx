import { render, screen } from '@testing-library/react'

import WebsitePage from '~/app/(authenicated)/website/page'

const mockGetRequiredWedding = jest.fn()
const mockGetWebsiteByUserId = jest.fn()
const mockGetHomeSection = jest.fn()
const mockGetSections = jest.fn()
const mockGetSession = jest.fn()
const mockDashboardTopbar = jest.fn(() => <header data-testid='dashboard-topbar'>Topbar</header>)
const mockWebsiteDisabledCallout = jest.fn(() => (
  <div data-testid='website-disabled-callout'>Disabled callout</div>
))
const mockWebsiteManager = jest.fn(() => <div data-testid='website-manager'>Manager</div>)
const mockWebsiteEditor = jest.fn((_props: { publicUrl: string; initialIntroText: string }) => (
  <div data-testid='website-editor'>Editor</div>
))

jest.mock('~/trpc/server', () => ({
  api: {
    website: {
      getByUserId: () => mockGetWebsiteByUserId(),
    },
    websiteSection: {
      getHomeSection: () => mockGetHomeSection(),
      getSections: () => mockGetSections(),
    },
  },
}))

jest.mock('~/server/application/authenticated-route/authenticated-route-data', () => ({
  getRequiredWedding: () => mockGetRequiredWedding(),
}))

jest.mock('~/lib/auth', () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}))

jest.mock('next/headers', () => ({
  headers: jest.fn().mockResolvedValue(new Headers()),
}))

jest.mock('~/lib/website-slug', () => ({
  deriveWeddingSubUrl: jest.fn().mockReturnValue('johnandjane'),
}))

jest.mock('~/components/dashboard/dashboard-topbar', () => ({
  __esModule: true,
  default: () => mockDashboardTopbar(),
}))

jest.mock('~/app/_components/website/website-disabled-callout', () => ({
  __esModule: true,
  WebsiteDisabledCallout: () => mockWebsiteDisabledCallout(),
}))

jest.mock('~/components/website-manager/website-manager', () => ({
  __esModule: true,
  WebsiteManager: () => mockWebsiteManager(),
}))

jest.mock('~/app/_components/website/website-editor', () => ({
  __esModule: true,
  WebsiteEditor: (props: { publicUrl: string; initialIntroText: string }) =>
    mockWebsiteEditor(props),
}))

jest.mock('~/app/_components/website/template-picker', () => ({
  __esModule: true,
  TemplatePicker: () => <div data-testid='template-picker'>Template picker</div>,
}))

jest.mock('~/app/_components/website/sections-editor', () => ({
  __esModule: true,
  SectionsEditor: () => <div data-testid='sections-editor'>Sections editor</div>,
}))

describe('WebsitePage', () => {
  beforeEach(() => {
    mockGetRequiredWedding.mockReset()
    mockGetWebsiteByUserId.mockReset()
    mockGetHomeSection.mockReset()
    mockGetSession.mockReset()
    mockDashboardTopbar.mockClear()
    mockWebsiteDisabledCallout.mockClear()
    mockWebsiteManager.mockClear()
    mockWebsiteEditor.mockClear()
    mockGetHomeSection.mockResolvedValue(null)
    mockGetSections.mockResolvedValue([])
    mockGetSession.mockResolvedValue({ user: { email: 'test@example.com' } })

    mockGetRequiredWedding.mockResolvedValue({
      id: 'wedding-123',
      groomFirstName: 'John',
      groomLastName: 'Doe',
      brideFirstName: 'Jane',
      brideLastName: 'Smith',
      enabledAddOns: [],
    })
  })

  it('renders the disabled callout when website_builder is not enabled', async () => {
    mockGetRequiredWedding.mockResolvedValue({
      id: 'wedding-123',
      groomFirstName: 'John',
      groomLastName: 'Doe',
      brideFirstName: 'Jane',
      brideLastName: 'Smith',
      enabledAddOns: [],
    })

    const page = await WebsitePage()
    render(page)

    expect(screen.getByTestId('dashboard-topbar')).toBeInTheDocument()
    expect(screen.getByTestId('website-disabled-callout')).toBeInTheDocument()
    expect(mockWebsiteEditor).not.toHaveBeenCalled()
  })

  it('renders the website manager without the editor when no website exists yet', async () => {
    mockGetRequiredWedding.mockResolvedValue({
      id: 'wedding-123',
      groomFirstName: 'John',
      groomLastName: 'Doe',
      brideFirstName: 'Jane',
      brideLastName: 'Smith',
      enabledAddOns: ['website_builder'],
    })
    mockGetWebsiteByUserId.mockResolvedValue(null)

    const page = await WebsitePage()
    render(page)

    expect(screen.getByTestId('website-manager')).toBeInTheDocument()
    expect(mockWebsiteEditor).not.toHaveBeenCalled()
  })

  it('reuses the existing website when one already exists', async () => {
    mockGetRequiredWedding.mockResolvedValue({
      id: 'wedding-123',
      groomFirstName: 'John',
      groomLastName: 'Doe',
      brideFirstName: 'Jane',
      brideLastName: 'Smith',
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
      initialIntroText: '',
    })
  })

  it('loads the existing HOME intro text into the editor', async () => {
    mockGetRequiredWedding.mockResolvedValue({
      id: 'wedding-123',
      groomFirstName: 'John',
      groomLastName: 'Doe',
      brideFirstName: 'Jane',
      brideLastName: 'Smith',
      enabledAddOns: ['website_builder'],
    })
    mockGetWebsiteByUserId.mockResolvedValue({
      id: 'website-789',
      subUrl: 'existing-site',
    })
    mockGetHomeSection.mockResolvedValue({
      id: 'section-123',
      type: 'HOME',
      content: {
        introText: 'Welcome to our wedding weekend.',
      },
    })

    const page = await WebsitePage()
    render(page)

    expect(mockWebsiteEditor).toHaveBeenCalledWith({
      publicUrl: 'http://localhost:3000/w/existing-site',
      initialIntroText: 'Welcome to our wedding weekend.',
    })
  })
})
