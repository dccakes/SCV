import { render } from '@testing-library/react'
import { createElement } from 'react'

import RootRouteHandler, { generateMetadata } from '~/app/w/[websiteSubUrl]/page'

let mockLocale: 'en' | 'es' = 'en'
jest.mock('next-intl/server', () =>
  jest
    .requireActual('~/../tests/unit/test-utils/intl-server')
    .createIntlServerMock(() => mockLocale)
)

const mockLoadVisitorWedding = jest.fn()
const mockCookiesGet = jest.fn()
const mockWeddingWebsite = jest.fn(
  ({ websiteSubUrl }: { websiteSubUrl: string; weddingData?: unknown }) =>
    createElement('div', null, websiteSubUrl)
)

jest.mock('~/app/w/[websiteSubUrl]/_lib/load-visitor-wedding', () => ({
  loadVisitorWedding: (...args: unknown[]) => mockLoadVisitorWedding(...args),
}))

const mockResolveInvitedHousehold = jest.fn()
jest.mock('~/app/w/[websiteSubUrl]/_lib/invited-household', () => ({
  resolveInvitedHousehold: (...args: unknown[]) => mockResolveInvitedHousehold(...args),
}))

jest.mock('~/trpc/server', () => ({
  api: {
    website: {
      verifyWebsitePassword: jest.fn(),
    },
  },
}))

jest.mock('~/components/website/wedding', () => ({
  __esModule: true,
  default: (props: { websiteSubUrl: string; weddingData?: unknown }) => mockWeddingWebsite(props),
}))

jest.mock('~/components/website/password-page', () => ({
  __esModule: true,
  default: () => createElement('div', null, 'Password'),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    get: mockCookiesGet,
  })),
}))

describe('website suburl metadata + page wiring', () => {
  beforeEach(() => {
    mockLoadVisitorWedding.mockReset()
    mockCookiesGet.mockReset()
    mockCookiesGet.mockReturnValue(undefined)
    mockWeddingWebsite.mockClear()
    mockResolveInvitedHousehold.mockReset()
    mockResolveInvitedHousehold.mockResolvedValue(null)
  })

  it('uses params.websiteSubUrl to build metadata title', async () => {
    mockLoadVisitorWedding.mockResolvedValue({
      loadResult: {
        status: 'ready',
        weddingData: {
          groomFirstName: 'John',
          groomLastName: 'Doe',
          brideFirstName: 'Jane',
          brideLastName: 'Smith',
          website: {
            introText: 'Join us for the wedding',
            headline: 'Celebrate Love',
            headlineAccent: 'With Us',
          },
        },
      },
    })

    const metadata = await (
      generateMetadata as (props: {
        params: Promise<{ websiteSubUrl: string }>
      }) => Promise<{ title?: string }>
    )({
      params: Promise.resolve({ websiteSubUrl: 'john-and-jane' }),
    })

    expect(metadata.title).toBe('Jane Smith & John Doe Wedding')
    expect(mockLoadVisitorWedding).toHaveBeenCalledWith('john-and-jane')
  })

  it('localizes the fallback title and description for Spanish-speaking visitors', async () => {
    mockLocale = 'es'
    mockLoadVisitorWedding.mockResolvedValue({
      loadResult: {
        status: 'ready',
        weddingData: {
          groomFirstName: 'John',
          groomLastName: 'Doe',
          brideFirstName: 'Jane',
          brideLastName: 'Smith',
          website: { introText: '' },
        },
      },
    })

    const metadata = await (
      generateMetadata as (props: {
        params: Promise<{ websiteSubUrl: string }>
      }) => Promise<{ title?: string; description?: string }>
    )({ params: Promise.resolve({ websiteSubUrl: 'john-and-jane' }) })

    expect(metadata.title).toBe('Boda de Jane Smith & John Doe')
    expect(metadata.description).toBe('Acompáñanos a la boda de Jane Smith y John Doe.')
    mockLocale = 'en'
  })

  it('passes params.websiteSubUrl into WeddingWebsite', async () => {
    const weddingData = {
      groomFirstName: 'John',
      groomLastName: 'Doe',
      brideFirstName: 'Jane',
      brideLastName: 'Smith',
      websiteBuilderEnabled: true,
      website: {
        id: 'website-1',
        subUrl: 'john-and-jane',
        introText: '',
        headline: 'Celebrate Love',
        headlineAccent: 'With Us',
      },
      events: [],
    }
    mockLoadVisitorWedding.mockResolvedValue({
      loadResult: {
        status: 'ready',
        weddingData,
      },
    })

    const page = await RootRouteHandler({
      params: Promise.resolve({ websiteSubUrl: 'john-and-jane' }),
    })

    render(page)

    expect(mockWeddingWebsite).toHaveBeenCalledWith({
      websiteSubUrl: 'john-and-jane',
      weddingData,
      invitedHousehold: null,
    })
  })
})
