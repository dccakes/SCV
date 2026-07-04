import { render } from '@testing-library/react'
import { createElement } from 'react'

import RootRouteHandler, { generateMetadata } from '~/app/w/[websiteSubUrl]/page'

const mockLoadWeddingBySubUrl = jest.fn()
const mockCookiesGet = jest.fn()
const mockWeddingWebsite = jest.fn(
  ({ websiteSubUrl }: { websiteSubUrl: string; weddingData?: unknown }) =>
    createElement('div', null, websiteSubUrl)
)

jest.mock('~/app/w/[websiteSubUrl]/_lib/load-wedding-by-suburl', () => ({
  loadWeddingBySubUrl: (...args: unknown[]) => mockLoadWeddingBySubUrl(...args),
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
    mockLoadWeddingBySubUrl.mockReset()
    mockCookiesGet.mockReset()
    mockCookiesGet.mockReturnValue(undefined)
    mockWeddingWebsite.mockClear()
    mockResolveInvitedHousehold.mockReset()
    mockResolveInvitedHousehold.mockResolvedValue(null)
  })

  it('uses params.websiteSubUrl to build metadata title', async () => {
    mockLoadWeddingBySubUrl.mockResolvedValue({
      status: 'ready',
      weddingData: {
        groomFirstName: 'John',
        groomLastName: 'Doe',
        brideFirstName: 'Jane',
        brideLastName: 'Smith',
      },
    })

    const metadata = await (
      generateMetadata as (props: {
        params: Promise<{ websiteSubUrl: string }>
      }) => Promise<{ title?: string }>
    )({
      params: Promise.resolve({ websiteSubUrl: 'john-and-jane' }),
    })

    expect(metadata.title).toBe("John Doe and Jane Smith's Wedding Website")
    expect(mockLoadWeddingBySubUrl).toHaveBeenCalledWith('john-and-jane', undefined, undefined)
  })

  it('passes params.websiteSubUrl into WeddingWebsite', async () => {
    const weddingData = {
      groomFirstName: 'John',
      groomLastName: 'Doe',
      brideFirstName: 'Jane',
      brideLastName: 'Smith',
      websiteBuilderEnabled: true,
      website: { id: 'website-1', subUrl: 'john-and-jane', introText: '' },
      events: [],
    }
    mockLoadWeddingBySubUrl.mockResolvedValue({
      status: 'ready',
      weddingData,
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
