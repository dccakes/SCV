import { render, screen } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import RsvpPage, { generateMetadata } from '~/app/w/[websiteSubUrl]/rsvp/page'

const mockFetchWeddingData = jest.fn()
const mockCookiesGet = jest.fn()
const mockNotFound = jest.fn()

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
}))

jest.mock('~/trpc/server', () => ({
  api: {
    website: {
      fetchWeddingData: (input: { subUrl: string }) => mockFetchWeddingData(input),
      verifyWebsitePassword: jest.fn(),
    },
  },
}))

// The page resolves the guest's recognized household through the invite service.
// Mock it so importing the page doesn't pull the server tRPC/auth stack (and its
// ESM-only better-auth dependency) into the jest module graph.
jest.mock('~/server/application/household-invite', () => ({
  householdInviteService: {
    getRecognizedRsvpHousehold: jest.fn(),
  },
}))

jest.mock('~/components/contexts/rsvp-form-context', () => ({
  RsvpFormProvider: ({ children }: { children: ReactNode }) => createElement('div', null, children),
}))

jest.mock('~/components/website/forms/main', () => ({
  __esModule: true,
  default: () => createElement('div', null, 'Form'),
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

describe('rsvp page loader', () => {
  beforeEach(() => {
    mockFetchWeddingData.mockReset()
    mockCookiesGet.mockReset()
    mockCookiesGet.mockReturnValue(undefined)
    mockNotFound.mockReset()
  })

  it('loads the same suburl for metadata and page rendering', async () => {
    mockFetchWeddingData.mockResolvedValue({
      groomFirstName: 'John',
      groomLastName: 'Doe',
      brideFirstName: 'Jane',
      brideLastName: 'Smith',
      website: {
        isRsvpEnabled: true,
      },
    })

    const params = Promise.resolve({ websiteSubUrl: 'john-and-jane' })

    await (
      generateMetadata as (props: {
        params: Promise<{ websiteSubUrl: string }>
      }) => Promise<{ title?: string }>
    )({ params })
    await (
      RsvpPage as (props: { params: Promise<{ websiteSubUrl: string }> }) => Promise<ReactNode>
    )({ params })

    expect(mockFetchWeddingData).toHaveBeenCalledTimes(2)
    expect(mockFetchWeddingData).toHaveBeenNthCalledWith(1, {
      subUrl: 'john-and-jane',
      accessToken: undefined,
    })
    expect(mockFetchWeddingData).toHaveBeenNthCalledWith(2, {
      subUrl: 'john-and-jane',
      accessToken: undefined,
    })
  })

  it('reclaims the per-website favicon so the RSVP page inherits the wedding icon', async () => {
    mockFetchWeddingData.mockResolvedValue({
      groomFirstName: 'John',
      groomLastName: 'Doe',
      brideFirstName: 'Jane',
      brideLastName: 'Smith',
      website: {
        isRsvpEnabled: true,
      },
    })

    const metadata = await (
      generateMetadata as (props: {
        params: Promise<{ websiteSubUrl: string }>
      }) => Promise<{ icons?: Array<{ url: string }> }>
    )({ params: Promise.resolve({ websiteSubUrl: 'john-and-jane' }) })

    expect(metadata.icons).toEqual([
      { rel: 'icon', url: '/w/john-and-jane/icon', type: 'image/png', sizes: '32x32' },
    ])
  })

  it('renders the password page when RSVP access requires a website password', async () => {
    mockFetchWeddingData.mockRejectedValue({ code: 'FORBIDDEN' })

    const page = await (
      RsvpPage as (props: { params: Promise<{ websiteSubUrl: string }> }) => Promise<ReactNode>
    )({
      params: Promise.resolve({ websiteSubUrl: 'john-and-jane' }),
    })

    render(page)

    expect(screen.getByText('Password')).toBeInTheDocument()
  })
})
