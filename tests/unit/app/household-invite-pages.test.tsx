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
const mockGetPublicWeddingSummary = jest.fn()

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
    getPublicWeddingSummary: (...args: unknown[]) => mockGetPublicWeddingSummary(...args),
  },
}))

const inviteData = {
  weddingId: 'wedding-123',
  expiresAt: new Date('2027-06-18T12:00:00.000Z'),
  wedding: {
    groomFirstName: 'Diego',
    groomLastName: 'Carvallo',
    brideFirstName: 'Laura',
    brideLastName: 'Zurich',
    date: new Date('2027-05-30T12:00:00.000Z'),
    venue: 'Puebla, Mexico',
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
    mockGetPublicWeddingSummary.mockReset()
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

  it('builds save-the-date open graph metadata from the wedding date and venue', async () => {
    mockGetPublicWeddingSummary.mockResolvedValue({
      groomFirstName: 'Diego',
      brideFirstName: 'Holly',
      date: new Date('2027-05-30T12:00:00.000Z'),
      venue: 'Puebla, Mexico',
    })
    const { generateMetadata } = await import('~/app/[websiteSubUrl]/invite/page')

    const metadata = await generateMetadata({
      params: Promise.resolve({ websiteSubUrl: 'holly-and-diego' }),
    })

    expect(mockGetPublicWeddingSummary).toHaveBeenCalledWith('holly-and-diego')
    const expectedTitle = "Save the Date — Diego & Holly's Wedding"
    expect(metadata.title).toBe(expectedTitle)
    expect(metadata.openGraph?.title).toBe(expectedTitle)
    expect(metadata.twitter?.title).toBe(expectedTitle)
    expect(metadata.openGraph?.description).toContain('May 30, 2027')
    expect(metadata.openGraph?.description).toContain('Puebla, Mexico')
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })

  it('omits the date and venue from metadata when the wedding has neither yet', async () => {
    mockGetPublicWeddingSummary.mockResolvedValue({
      groomFirstName: 'Diego',
      brideFirstName: 'Holly',
      date: null,
      venue: null,
    })
    const { generateMetadata } = await import('~/app/[websiteSubUrl]/invite/page')

    const metadata = await generateMetadata({
      params: Promise.resolve({ websiteSubUrl: 'holly-and-diego' }),
    })

    expect(metadata.title).toBe("Save the Date — Diego & Holly's Wedding")
    expect(metadata.openGraph?.description).toBe(
      'Diego & Holly are getting married. Open your household invitation to confirm your details.'
    )
  })

  it('falls back to noindex-only metadata when the slug has no wedding', async () => {
    mockGetPublicWeddingSummary.mockResolvedValue(null)
    const { generateMetadata } = await import('~/app/[websiteSubUrl]/invite/page')

    const metadata = await generateMetadata({
      params: Promise.resolve({ websiteSubUrl: 'unknown-slug' }),
    })

    expect(metadata.title).toBeUndefined()
    expect(metadata.openGraph).toBeUndefined()
    expect(metadata.robots).toEqual({ index: false, follow: false })
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
