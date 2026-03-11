import { render } from '@testing-library/react'
import { createElement } from 'react'

import RootRouteHandler, { generateMetadata } from '~/app/[websiteSubUrl]/page'

const mockFetchWeddingData = jest.fn()
const mockGetUser = jest.fn()
const mockGetBySubUrl = jest.fn()
const mockWeddingWebsite = jest.fn(({ websiteSubUrl }: { websiteSubUrl: string }) =>
  createElement('div', null, websiteSubUrl)
)

jest.mock('~/trpc/server', () => ({
  api: {
    user: {
      get: {
        query: () => mockGetUser(),
      },
    },
    website: {
      fetchWeddingData: {
        query: (input: { subUrl: string }) => mockFetchWeddingData(input),
      },
      getBySubUrl: {
        query: (input: { subUrl: string }) => mockGetBySubUrl(input),
      },
      hasPasswordAccess: {
        query: jest.fn(),
      },
      verifyWebsitePassword: {
        mutate: jest.fn(),
      },
    },
  },
}))

jest.mock('~/components/website/wedding', () => ({
  __esModule: true,
  default: (props: { websiteSubUrl: string }) => mockWeddingWebsite(props),
}))

jest.mock('~/components/website/password-page', () => ({
  __esModule: true,
  default: () => createElement('div', null, 'Password'),
}))

describe('website suburl metadata + page wiring', () => {
  beforeEach(() => {
    mockFetchWeddingData.mockReset()
    mockGetUser.mockReset()
    mockGetBySubUrl.mockReset()
    mockWeddingWebsite.mockClear()
  })

  it('uses params.websiteSubUrl to build metadata title', async () => {
    mockFetchWeddingData.mockResolvedValue({
      groomFirstName: 'John',
      groomLastName: 'Doe',
      brideFirstName: 'Jane',
      brideLastName: 'Smith',
    })

    const metadata = await (
      generateMetadata as (props: {
        params: Promise<{ websiteSubUrl: string }>
      }) => Promise<{ title?: string }>
    )({
      params: Promise.resolve({ websiteSubUrl: 'john-and-jane' }),
    })

    expect(metadata.title).toBe("John Doe and Jane Smith's Wedding Website")
    expect(mockFetchWeddingData).toHaveBeenCalledWith({ subUrl: 'john-and-jane' })
    expect(mockGetUser).not.toHaveBeenCalled()
  })

  it('passes params.websiteSubUrl into WeddingWebsite', async () => {
    mockGetBySubUrl.mockResolvedValue({
      id: 'website-1',
      isPasswordEnabled: false,
    })

    const page = await RootRouteHandler({
      params: Promise.resolve({ websiteSubUrl: 'john-and-jane' }),
    })

    render(page)

    expect(mockWeddingWebsite).toHaveBeenCalledWith({ websiteSubUrl: 'john-and-jane' })
  })
})
