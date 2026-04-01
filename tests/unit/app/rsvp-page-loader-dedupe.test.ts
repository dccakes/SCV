import { createElement, type ReactNode } from 'react'

import RsvpPage, { generateMetadata } from '~/app/[websiteSubUrl]/rsvp/page'

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
    },
  },
}))

jest.mock('~/components/contexts/rsvp-form-context', () => ({
  RsvpFormProvider: ({ children }: { children: ReactNode }) => createElement('div', null, children),
}))

jest.mock('~/components/website/forms/main', () => ({
  __esModule: true,
  default: () => createElement('div', null, 'Form'),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    get: mockCookiesGet,
  })),
}))

describe('rsvp page loader dedupe', () => {
  beforeEach(() => {
    mockFetchWeddingData.mockReset()
    mockCookiesGet.mockReset()
    mockCookiesGet.mockReturnValue(undefined)
    mockNotFound.mockReset()
  })

  it('dedupes metadata and page loading for the same suburl', async () => {
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

    expect(mockFetchWeddingData).toHaveBeenCalledTimes(1)
    expect(mockFetchWeddingData).toHaveBeenCalledWith({
      subUrl: 'john-and-jane',
      accessToken: undefined,
    })
  })
})
