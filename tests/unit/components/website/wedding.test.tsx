import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

import WeddingWebsite from '~/components/website/wedding'

const mockHeadersGet = jest.fn()
const mockResolveTemplate = jest.fn()

jest.mock('next/headers', () => ({
  headers: () =>
    Promise.resolve({
      get: mockHeadersGet,
    }),
}))

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}))

jest.mock('~/templates', () => ({
  __esModule: true,
  TemplateThemeProvider: ({ children }: { children: React.ReactNode }) =>
    createElement('div', { 'data-testid': 'template-root' }, children),
  resolveTemplate: (templateId: string | null | undefined) => mockResolveTemplate(templateId),
}))

const buildTemplate = (id: string) => ({
  id,
  components: {
    Home: ({ path, introText }: { path: string; introText?: string }) =>
      createElement('div', { 'data-testid': 'full-page' }, `${path}|${introText ?? ''}`),
    HomeMobile: ({ path, introText }: { path: string; introText?: string }) =>
      createElement('div', { 'data-testid': 'mobile-page' }, `${path}|${introText ?? ''}`),
    Minimal: ({ path, isRsvpEnabled }: { path: string; isRsvpEnabled: boolean }) =>
      createElement('div', { 'data-testid': 'minimal-page' }, `${path}|${String(isRsvpEnabled)}`),
  },
})

const createWeddingData = (overrides: Record<string, unknown> = {}) => ({
  groomFirstName: 'Shrek',
  groomLastName: 'Ogre',
  brideFirstName: 'Fiona',
  brideLastName: 'Ogre',
  daysRemaining: 0,
  date: {
    standardFormat: 'Tomorrow',
    numberFormat: '2026-04-25',
  },
  events: [],
  website: {
    id: 'website-1',
    weddingId: 'wedding-1',
    subUrl: 'shrek-and-fiona',
    templateId: 'aurelia',
    isPasswordEnabled: false,
    isRsvpEnabled: true,
    coverPhotoUrl: null,
    introText: '',
  },
  websiteBuilderEnabled: false,
  ...overrides,
})

describe('WeddingWebsite', () => {
  beforeEach(() => {
    mockHeadersGet.mockReset()
    mockResolveTemplate.mockReset()
    mockResolveTemplate.mockImplementation((id: string | null | undefined) =>
      buildTemplate(id ?? 'classic')
    )
    mockHeadersGet.mockReturnValue('?0')
  })

  it('resolves the template from the stored templateId', async () => {
    render(
      await WeddingWebsite({ websiteSubUrl: 'shrek-and-fiona', weddingData: createWeddingData() })
    )

    expect(mockResolveTemplate).toHaveBeenCalledWith('aurelia')
    expect(screen.getByTestId('template-root')).toBeInTheDocument()
  })

  it('renders the minimal page when website_builder is disabled', async () => {
    render(
      await WeddingWebsite({ websiteSubUrl: 'shrek-and-fiona', weddingData: createWeddingData() })
    )

    expect(screen.getByTestId('minimal-page')).toHaveTextContent('/w/shrek-and-fiona|true')
  })

  it('renders the full home surface on desktop when website_builder is enabled', async () => {
    render(
      await WeddingWebsite({
        websiteSubUrl: 'shrek-and-fiona',
        weddingData: createWeddingData({
          websiteBuilderEnabled: true,
          website: {
            ...createWeddingData().website,
            introText: 'Welcome to our wedding weekend.',
          },
        }),
      })
    )

    expect(screen.getByTestId('full-page')).toHaveTextContent(
      '/w/shrek-and-fiona|Welcome to our wedding weekend.'
    )
  })

  it('renders the mobile home surface when website_builder is enabled on mobile', async () => {
    mockHeadersGet.mockReturnValue('?1')
    render(
      await WeddingWebsite({
        websiteSubUrl: 'shrek-and-fiona',
        weddingData: createWeddingData({
          websiteBuilderEnabled: true,
        }),
      })
    )

    expect(screen.getByTestId('mobile-page')).toHaveTextContent('/w/shrek-and-fiona')
  })
})
