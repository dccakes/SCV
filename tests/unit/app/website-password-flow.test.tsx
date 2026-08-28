import { render, screen } from '@testing-library/react'

import RootRouteHandler from '~/app/w/[websiteSubUrl]/page'

const mockFetchWeddingData = jest.fn()
const mockVerifyWebsitePassword = jest.fn()
const mockCookieGet = jest.fn()
const mockCookieSet = jest.fn()

const mockPasswordPage = jest.fn(
  ({
    verifyWebsitePassword,
  }: {
    verifyWebsitePassword: (passwordInput: string) => Promise<boolean>
  }) => {
    void verifyWebsitePassword
    return <div data-testid='password-page'>Password Page</div>
  }
)

jest.mock('~/trpc/server', () => ({
  api: {
    website: {
      fetchWeddingData: (input: { subUrl: string; accessToken?: string }) =>
        mockFetchWeddingData(input),
      verifyWebsitePassword: (input: { subUrl: string; password: string }) =>
        mockVerifyWebsitePassword(input),
    },
  },
}))

jest.mock('next/headers', () => ({
  cookies: () =>
    Promise.resolve({
      get: mockCookieGet,
      set: mockCookieSet,
    }),
}))

jest.mock('~/components/website/password-page', () => ({
  __esModule: true,
  default: (props: { verifyWebsitePassword: (passwordInput: string) => Promise<boolean> }) =>
    mockPasswordPage(props),
}))

jest.mock('~/components/website/wedding', () => ({
  __esModule: true,
  default: () => <div data-testid='wedding-website'>Wedding Website</div>,
}))

const mockResolveInvitedHousehold = jest.fn()
jest.mock('~/app/w/[websiteSubUrl]/_lib/invited-household', () => ({
  resolveInvitedHousehold: (...args: unknown[]) => mockResolveInvitedHousehold(...args),
}))

describe('Website password flow', () => {
  beforeEach(() => {
    mockFetchWeddingData.mockReset()
    mockVerifyWebsitePassword.mockReset()
    mockCookieGet.mockReset()
    mockCookieSet.mockReset()
    mockPasswordPage.mockClear()
    mockResolveInvitedHousehold.mockReset()
    mockResolveInvitedHousehold.mockResolvedValue(null)
  })

  it('does not send website password to PasswordPage props', async () => {
    mockFetchWeddingData.mockRejectedValue({ code: 'FORBIDDEN' })
    mockCookieGet.mockReturnValue(undefined)

    const page = await RootRouteHandler({
      params: Promise.resolve({ websiteSubUrl: 'johnandjane' }),
    })
    render(page)

    expect(screen.getByTestId('password-page')).toBeInTheDocument()
    expect(mockPasswordPage).toHaveBeenCalled()
    expect(mockPasswordPage.mock.calls[0]?.[0]).not.toHaveProperty('website')
    expect(mockPasswordPage.mock.calls[0]?.[0]).not.toHaveProperty('password')
  })

  it('skips the password page and forwards the invite token for a recognized guest', async () => {
    mockFetchWeddingData.mockResolvedValue({
      groomFirstName: 'John',
      groomLastName: 'Doe',
      brideFirstName: 'Jane',
      brideLastName: 'Smith',
    })
    mockCookieGet.mockImplementation((name: string) =>
      name === 'household_invite_johnandjane' ? { value: 'invite-token-123' } : undefined
    )

    const page = await RootRouteHandler({
      params: Promise.resolve({ websiteSubUrl: 'johnandjane' }),
    })
    render(page)

    expect(screen.getByTestId('wedding-website')).toBeInTheDocument()
    expect(screen.queryByTestId('password-page')).not.toBeInTheDocument()
    expect(mockFetchWeddingData).toHaveBeenCalledWith(
      expect.objectContaining({ subUrl: 'johnandjane', inviteToken: 'invite-token-123' })
    )
    expect(mockResolveInvitedHousehold).toHaveBeenCalledWith('johnandjane', 'invite-token-123')
  })

  it('verifies password on server action and sets secure httpOnly access cookie', async () => {
    mockFetchWeddingData.mockRejectedValue({ code: 'FORBIDDEN' })
    mockCookieGet.mockReturnValue(undefined)
    mockVerifyWebsitePassword.mockResolvedValue('signed-token')

    const page = await RootRouteHandler({
      params: Promise.resolve({ websiteSubUrl: 'johnandjane' }),
    })
    render(page)

    const props = mockPasswordPage.mock.calls[0]?.[0] as {
      verifyWebsitePassword: (passwordInput: string) => Promise<boolean>
    }

    const verified = await props.verifyWebsitePassword('secret123')

    expect(verified).toBe(true)
    expect(mockVerifyWebsitePassword).toHaveBeenCalledWith({
      subUrl: 'johnandjane',
      password: 'secret123',
    })
    expect(mockCookieSet).toHaveBeenCalledWith(
      'wws_access_johnandjane',
      'signed-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/w/johnandjane',
      })
    )
  })
})
