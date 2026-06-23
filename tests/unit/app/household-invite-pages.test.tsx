import { render, screen } from '@testing-library/react'
import {
  Headers as UndiciHeaders,
  Request as UndiciRequest,
  Response as UndiciResponse,
} from 'undici'

Object.assign(globalThis, {
  Headers: UndiciHeaders,
  Request: UndiciRequest,
  Response: UndiciResponse,
})

const mockCookieGet = jest.fn()
const mockRedirect = jest.fn()
const mockGetInviteData = jest.fn()
const mockUpdateHouseholdDetails = jest.fn()

jest.mock('next/headers', () => ({
  cookies: () =>
    Promise.resolve({
      get: mockCookieGet,
    }),
}))

jest.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
}))

jest.mock('~/server/application/household-invite', () => ({
  householdInviteService: {
    getInviteData: (...args: unknown[]) => mockGetInviteData(...args),
    updateHouseholdDetails: (...args: unknown[]) => mockUpdateHouseholdDetails(...args),
  },
}))

const inviteTranslations: Record<string, string> = {
  saveTheDate: 'Save the date',
  detailsUpdated: 'Your details were updated.',
  date: 'Date',
  location: 'Location',
  invitedHousehold: 'Invited household',
  formalInvitationNote:
    'Formal invitation details will follow. For now, please make sure we have the correct names and mailing address for your household.',
  updateDetails: 'Update our details',
  couldNotOpen: 'We could not open this invitation.',
  invalidLinkDescription:
    'This invite link may be expired, mistyped, or opened without the original household link. Please use the save-the-date link you received, or ask the couple for a new one.',
}

jest.mock('next-intl/server', () => ({
  getTranslations: () => Promise.resolve((key: string) => inviteTranslations[key] ?? key),
}))

jest.mock('~/components/website/household-invite/invalid-household-invite', () => ({
  InvalidHouseholdInvite: jest.fn().mockReturnValue(
    <div>
      <p>We could not open this invitation.</p>
      <p>
        This invite link may be expired, mistyped, or opened without the original household link.
        Please use the save-the-date link you received, or ask the couple for a new one.
      </p>
    </div>
  ),
}))

const inviteData = {
  weddingId: 'wedding-123',
  expiresAt: new Date('2027-06-18T12:00:00.000Z'),
  wedding: {
    groomFirstName: 'Diego',
    groomLastName: 'Carvallo',
    brideFirstName: 'Laura',
    brideLastName: 'Zurich',
  },
  household: {
    id: 'household-123',
    address1: '123 Main St',
    address2: null,
    city: 'Puebla',
    state: 'Puebla',
    zipCode: '72000',
    country: 'Mexico',
  },
  guests: [
    {
      id: 1,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: null,
    },
  ],
}

describe('household invite pages', () => {
  beforeEach(() => {
    mockCookieGet.mockReset()
    mockRedirect.mockReset()
    mockGetInviteData.mockReset()
    mockUpdateHouseholdDetails.mockReset()
    jest.useFakeTimers().setSystemTime(new Date('2026-06-18T12:00:00.000Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('validates the token route, sets a token-matched household invite cookie, and redirects', async () => {
    mockGetInviteData.mockResolvedValue(inviteData)
    const { GET } = await import('~/app/[websiteSubUrl]/invite/[token]/route')

    const response = await GET(new Request('https://example.com/diego-and-laura/invite/token'), {
      params: Promise.resolve({
        websiteSubUrl: 'diego-and-laura',
        token: 'signed-token',
      }),
    })

    expect(mockGetInviteData).toHaveBeenCalledWith('diego-and-laura', 'signed-token')
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://example.com/diego-and-laura/invite')
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
    expect(response.headers.get('set-cookie')).toEqual(
      expect.stringContaining('household_invite_diego-and-laura=signed-token')
    )
    expect(response.headers.get('set-cookie')).toEqual(expect.stringContaining('Max-Age=31536000'))
    expect(response.headers.get('set-cookie')).toEqual(
      expect.stringContaining('Path=/diego-and-laura')
    )
  })

  it('renders the authenticated save-the-date page with household names and wedding details', async () => {
    mockCookieGet.mockReturnValue({ value: 'cookie-token' })
    mockGetInviteData.mockResolvedValue(inviteData)
    const InvitePage = (await import('~/app/[websiteSubUrl]/invite/page')).default

    render(
      await InvitePage({
        params: Promise.resolve({ websiteSubUrl: 'diego-and-laura' }),
        searchParams: Promise.resolve({ updated: '1' }),
      })
    )

    expect(screen.getByText('Save the date')).toBeInTheDocument()
    expect(screen.getByText('May 30, 2027')).toBeInTheDocument()
    expect(screen.getByText('Puebla, Mexico')).toBeInTheDocument()
    expect(screen.getByText('Diego & Laura')).toBeInTheDocument()
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /update our details/i })).toHaveAttribute(
      'href',
      '/diego-and-laura/invite/update'
    )
    expect(screen.getByText('Your details were updated.')).toBeInTheDocument()
  })

  it('renders a guest-friendly invalid invite page without a valid household cookie', async () => {
    mockCookieGet.mockReturnValue(undefined)
    mockGetInviteData.mockResolvedValue(null)
    const InvitePage = (await import('~/app/[websiteSubUrl]/invite/page')).default

    render(
      await InvitePage({
        params: Promise.resolve({ websiteSubUrl: 'diego-and-laura' }),
        searchParams: Promise.resolve({ invalid: '1' }),
      })
    )

    expect(screen.getByText('We could not open this invitation.')).toBeInTheDocument()
    expect(screen.getByText(/ask the couple for a new one/i)).toBeInTheDocument()
  })
})
