import { redirect } from 'next/navigation'

import {
  getRequiredDashboardOverview,
  getRequiredWedding,
} from '~/server/application/authenticated-route/authenticated-route-data'
import { getDashboardOverview } from '~/server/application/dashboard/dashboard-request-data'
import { api } from '~/trpc/server'

jest.mock('next/navigation', () => ({
  redirect: jest.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
}))

jest.mock('~/server/application/dashboard/dashboard-request-data', () => ({
  getDashboardOverview: jest.fn(),
}))

jest.mock('~/trpc/server', () => ({
  api: {
    wedding: {
      getActive: jest.fn(),
    },
  },
}))

const mockRedirect = redirect as unknown as jest.Mock
const mockGetDashboardOverview = getDashboardOverview as jest.Mock
const mockGetWedding = api.wedding.getActive as jest.Mock

describe('authenticated route data', () => {
  beforeEach(() => {
    mockRedirect.mockClear()
    mockGetDashboardOverview.mockReset()
    mockGetWedding.mockReset()
  })

  it('returns dashboard data when dashboard overview exists', async () => {
    const expected = { totalGuests: 2 } as unknown
    mockGetDashboardOverview.mockResolvedValue(expected)

    const result = await getRequiredDashboardOverview()

    expect(result).toEqual(expected)
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('redirects to home when dashboard overview is missing', async () => {
    mockGetDashboardOverview.mockResolvedValue(null)

    await expect(getRequiredDashboardOverview()).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/')
  })

  it('redirects to home when dashboard overview throws FORBIDDEN', async () => {
    mockGetDashboardOverview.mockRejectedValue({ code: 'FORBIDDEN' })

    await expect(getRequiredDashboardOverview()).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/')
  })

  it('returns wedding when user wedding exists', async () => {
    const expected = { id: 'wed-1' }
    mockGetWedding.mockResolvedValue(expected)

    const result = await getRequiredWedding()

    expect(result).toEqual(expected)
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('redirects to home when wedding is missing', async () => {
    mockGetWedding.mockResolvedValue(null)

    await expect(getRequiredWedding()).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/')
  })

  it('redirects to home when wedding lookup throws FORBIDDEN', async () => {
    mockGetWedding.mockRejectedValue({ code: 'FORBIDDEN' })

    await expect(getRequiredWedding()).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/')
  })
})
