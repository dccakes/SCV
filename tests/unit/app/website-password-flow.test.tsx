import { render, screen } from '@testing-library/react'

import RootRouteHandler from '~/app/w/[websiteSubUrl]/page'

const mockFetchWeddingData = jest.fn()
const mockGetBySubUrl = jest.fn()
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
      getBySubUrl: () => mockGetBySubUrl(),
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

describe('Website password flow', () => {
  beforeEach(() => {
    mockFetchWeddingData.mockReset()
    mockGetBySubUrl.mockReset()
    mockVerifyWebsitePassword.mockReset()
    mockCookieGet.mockReset()
    mockCookieSet.mockReset()
    mockPasswordPage.mockClear()
  })

  it('does not send website password to PasswordPage props', async () => {
    mockGetBySubUrl.mockResolvedValue({
      id: 'website-123',
      weddingId: 'wedding-123',
      url: 'https://example.com/johnandjane',
      subUrl: 'johnandjane',
      isPasswordEnabled: true,
      isRsvpEnabled: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      coverPhotoUrl: null,
    })
    mockFetchWeddingData.mockRejectedValue(new Error('Password required'))
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

  it('verifies password on server action and sets secure httpOnly access cookie', async () => {
    mockGetBySubUrl.mockResolvedValue({
      id: 'website-123',
      weddingId: 'wedding-123',
      url: 'https://example.com/johnandjane',
      subUrl: 'johnandjane',
      isPasswordEnabled: true,
      isRsvpEnabled: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      coverPhotoUrl: null,
    })
    mockFetchWeddingData.mockRejectedValue(new Error('Password required'))
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
