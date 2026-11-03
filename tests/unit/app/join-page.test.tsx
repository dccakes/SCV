import { fireEvent, render, screen } from '@testing-library/react'

import JoinPage from '~/app/join/[token]/page'

type QueryOptions = {
  enabled?: boolean
  retry?: (failureCount: number, error: { data?: { code?: string } }) => boolean
}

const mockRefetch = jest.fn()
const mockUseQuery = jest.fn()

jest.mock('next/navigation', () => ({ useParams: () => ({ token: 'tok_123' }) }))
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))
jest.mock('~/trpc/react', () => ({
  api: {
    selfFill: {
      getByToken: { useQuery: (...args: unknown[]) => mockUseQuery(...args) },
      registerGuest: { useMutation: () => ({ mutate: jest.fn(), isPending: false }) },
    },
  },
}))

const queryState = (overrides: Record<string, unknown>) => ({
  data: undefined,
  isLoading: false,
  error: null,
  refetch: mockRefetch,
  ...overrides,
})

describe('JoinPage when the wedding lookup fails', () => {
  beforeEach(() => {
    mockRefetch.mockClear()
    mockUseQuery.mockReset()
  })

  it('says the page is busy, not that the link is bad, when the lookup was rate limited', () => {
    mockUseQuery.mockReturnValue(queryState({ error: { data: { code: 'TOO_MANY_REQUESTS' } } }))

    render(<JoinPage />)

    expect(screen.getByText('busyTitle')).toBeInTheDocument()
    expect(screen.getByText('busyDescription')).toBeInTheDocument()
    expect(screen.queryByText('linkNotFound')).not.toBeInTheDocument()
  })

  it('lets the guest retry from the busy screen', () => {
    mockUseQuery.mockReturnValue(queryState({ error: { data: { code: 'TOO_MANY_REQUESTS' } } }))
    render(<JoinPage />)

    fireEvent.click(screen.getByRole('button', { name: 'tryAgain' }))

    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  it('still says link not found for a genuinely missing link', () => {
    mockUseQuery.mockReturnValue(queryState({ error: { data: { code: 'NOT_FOUND' } } }))

    render(<JoinPage />)

    expect(screen.getByText('linkNotFound')).toBeInTheDocument()
    expect(screen.queryByText('busyTitle')).not.toBeInTheDocument()
  })

  it('does not retry a rate limited lookup (retries would spend the shared budget)', () => {
    mockUseQuery.mockReturnValue(queryState({}))
    render(<JoinPage />)

    const options = mockUseQuery.mock.calls[0]?.[1] as QueryOptions
    const rateLimited = { data: { code: 'TOO_MANY_REQUESTS' } }

    expect(options.retry?.(0, rateLimited)).toBe(false)
    expect(options.retry?.(0, { data: { code: 'INTERNAL_SERVER_ERROR' } })).toBe(true)
    expect(options.retry?.(3, { data: { code: 'INTERNAL_SERVER_ERROR' } })).toBe(false)
  })
})
