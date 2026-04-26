import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

import WeddingWebsite from '~/components/website/wedding'

const mockHeadersGet = jest.fn()
const mockWeddingPage = jest.fn(({ path, introText }: { path: string; introText?: string }) =>
  createElement('div', { 'data-testid': 'full-page' }, `${path}|${introText ?? ''}`)
)
const mockWeddingPageMobile = jest.fn(({ path, introText }: { path: string; introText?: string }) =>
  createElement('div', { 'data-testid': 'mobile-page' }, `${path}|${introText ?? ''}`)
)
const mockWebsiteMinimalPage = jest.fn(
  ({ path, isRsvpEnabled }: { path: string; isRsvpEnabled: boolean }) =>
    createElement('div', { 'data-testid': 'minimal-page' }, `${path}|${String(isRsvpEnabled)}`)
)

jest.mock('next/headers', () => ({
  headers: () =>
    Promise.resolve({
      get: mockHeadersGet,
    }),
}))

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}))

jest.mock('~/components/website/wedding-page', () => ({
  __esModule: true,
  default: (props: { path: string; introText?: string }) => mockWeddingPage(props),
}))

jest.mock('~/components/website/wedding-page-mobile', () => ({
  __esModule: true,
  default: (props: { path: string; introText?: string }) => mockWeddingPageMobile(props),
}))

jest.mock('~/components/website/minimal-page', () => ({
  __esModule: true,
  default: (props: { path: string; isRsvpEnabled: boolean }) => mockWebsiteMinimalPage(props),
}))

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
    mockWeddingPage.mockClear()
    mockWeddingPageMobile.mockClear()
    mockWebsiteMinimalPage.mockClear()
    mockHeadersGet.mockReturnValue('?0')
  })

  it('renders the minimal public page when website_builder is disabled', async () => {
    render(
      await WeddingWebsite({ websiteSubUrl: 'shrek-and-fiona', weddingData: createWeddingData() })
    )

    expect(screen.getByTestId('minimal-page')).toHaveTextContent('/w/shrek-and-fiona|true')
    expect(mockWeddingPage).not.toHaveBeenCalled()
    expect(mockWeddingPageMobile).not.toHaveBeenCalled()
  })

  it('renders the full public page on desktop when website_builder is enabled', async () => {
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
    expect(mockWebsiteMinimalPage).not.toHaveBeenCalled()
  })

  it('renders the mobile page variant when website_builder is enabled on mobile', async () => {
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
    expect(mockWeddingPage).not.toHaveBeenCalled()
  })
})
