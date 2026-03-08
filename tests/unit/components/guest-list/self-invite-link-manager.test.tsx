import { act, fireEvent, render, screen } from '@testing-library/react'

import { SelfInviteLinkManager } from '~/components/guest-list/self-invite-link-manager'

// ── Captured mutation callbacks ────────────────────────────────────────────
let capturedGenerateOnSuccess: (() => void) | undefined
let capturedGenerateOnError: (() => void) | undefined
let capturedRevokeOnSuccess: (() => void) | undefined
let capturedRevokeOnError: (() => void) | undefined

// ── tRPC mock handles ──────────────────────────────────────────────────────
const mockRefetch = jest.fn()
const mockGenerateMutate = jest.fn()
const mockRevokeMutate = jest.fn()
const mockGetTokenQuery = jest.fn()
const mockGenerateMutation = jest.fn()
const mockRevokeMutation = jest.fn()

// ── Toast + clipboard mocks ────────────────────────────────────────────────
const mockToastSuccess = jest.fn()
const mockToastError = jest.fn()
const mockWriteText = jest.fn()

jest.mock('~/trpc/react', () => ({
  api: {
    selfFill: {
      getToken: {
        useQuery: (...args: unknown[]) => mockGetTokenQuery(...args),
      },
      generateToken: {
        useMutation: (...args: unknown[]) => mockGenerateMutation(...args),
      },
      revokeToken: {
        useMutation: (...args: unknown[]) => mockRevokeMutation(...args),
      },
    },
  },
}))

jest.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}))

// ── Constants ──────────────────────────────────────────────────────────────
const TOKEN = 'abcdef1234567890abcdef1234567890'
const JOIN_URL = `http://localhost/join/${TOKEN}`

// ── Test helper ────────────────────────────────────────────────────────────
function setupMocks({
  token,
  expiresAt,
  earliestEventDate,
  isLoading = false,
  generateIsPending = false,
  revokeIsPending = false,
}: {
  token?: string | null
  expiresAt?: string | null
  earliestEventDate?: string | null
  isLoading?: boolean
  generateIsPending?: boolean
  revokeIsPending?: boolean
} = {}) {
  mockGetTokenQuery.mockReturnValue({
    data:
      token !== undefined
        ? { token, expiresAt: expiresAt ?? null, earliestEventDate: earliestEventDate ?? null }
        : undefined,
    isLoading,
    refetch: mockRefetch,
  })
  mockGenerateMutation.mockImplementation(
    (opts: { onSuccess?: () => void; onError?: () => void }) => {
      capturedGenerateOnSuccess = opts.onSuccess
      capturedGenerateOnError = opts.onError
      return { mutate: mockGenerateMutate, isPending: generateIsPending }
    }
  )
  mockRevokeMutation.mockImplementation(
    (opts: { onSuccess?: () => void; onError?: () => void }) => {
      capturedRevokeOnSuccess = opts.onSuccess
      capturedRevokeOnError = opts.onError
      return { mutate: mockRevokeMutate, isPending: revokeIsPending }
    }
  )
}

beforeAll(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: mockWriteText },
    writable: true,
  })
})

beforeEach(() => {
  capturedGenerateOnSuccess = undefined
  capturedGenerateOnError = undefined
  capturedRevokeOnSuccess = undefined
  capturedRevokeOnError = undefined
  mockWriteText.mockResolvedValue(undefined)
  setupMocks()
})

// ── Loading / no-token / token-exists render branches ─────────────────────
describe('render branches', () => {
  it('renders nothing while loading', () => {
    setupMocks({ isLoading: true })
    const { container } = render(<SelfInviteLinkManager />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows "Generate Invite Link" button when data is undefined (no token fetched yet)', () => {
    setupMocks()
    render(<SelfInviteLinkManager />)
    expect(screen.getByRole('button', { name: /generate invite link/i })).toBeInTheDocument()
  })

  it('shows "Generate Invite Link" button when token is null (token revoked)', () => {
    setupMocks({ token: null })
    render(<SelfInviteLinkManager />)
    expect(screen.getByRole('button', { name: /generate invite link/i })).toBeInTheDocument()
  })

  it('shows the invite URL in the display when a token exists', () => {
    setupMocks({ token: TOKEN })
    render(<SelfInviteLinkManager />)
    expect(screen.getByText(JOIN_URL)).toBeInTheDocument()
  })

  it('shows Copy, Reset, and Revoke buttons when a token exists', () => {
    setupMocks({ token: TOKEN })
    render(<SelfInviteLinkManager />)
    expect(screen.getByRole('button', { name: 'Copy invite link' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset invite link' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Revoke invite link' })).toBeInTheDocument()
  })

  it('shows expiry date text when expiresAt is set', () => {
    setupMocks({ token: TOKEN, expiresAt: '2026-09-01T00:00:00.000Z' })
    render(<SelfInviteLinkManager />)
    expect(screen.getByText(/link expires/i)).toBeInTheDocument()
  })

  it('does not show expiry text when expiresAt is null', () => {
    setupMocks({ token: TOKEN, expiresAt: null })
    render(<SelfInviteLinkManager />)
    expect(screen.queryByText(/link expires/i)).not.toBeInTheDocument()
  })

  it('disables "Generate Invite Link" button while generateToken is pending', () => {
    setupMocks({ generateIsPending: true })
    render(<SelfInviteLinkManager />)
    expect(screen.getByRole('button', { name: /generate invite link/i })).toBeDisabled()
  })

  it('disables Reset button while generateToken is pending', () => {
    setupMocks({ token: TOKEN, generateIsPending: true })
    render(<SelfInviteLinkManager />)
    expect(screen.getByRole('button', { name: 'Reset invite link' })).toBeDisabled()
  })

  it('disables Revoke button while revokeToken is pending', () => {
    setupMocks({ token: TOKEN, revokeIsPending: true })
    render(<SelfInviteLinkManager />)
    expect(screen.getByRole('button', { name: 'Revoke invite link' })).toBeDisabled()
  })

  it('Copy button is not disabled while generateToken is pending', () => {
    setupMocks({ token: TOKEN, generateIsPending: true })
    render(<SelfInviteLinkManager />)
    expect(screen.getByRole('button', { name: 'Copy invite link' })).not.toBeDisabled()
  })
})

// ── Copy: clipboard call, icon toggle, 2s revert, error handling ──────────
describe('copy', () => {
  it('calls clipboard.writeText with the full join URL', async () => {
    setupMocks({ token: TOKEN })
    render(<SelfInviteLinkManager />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy invite link' }))
    })
    expect(mockWriteText).toHaveBeenCalledWith(JOIN_URL)
  })

  it('shows Check icon (green) immediately after a successful copy', async () => {
    setupMocks({ token: TOKEN })
    render(<SelfInviteLinkManager />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy invite link' }))
    })
    const btn = screen.getByRole('button', { name: 'Copied!' })
    expect(btn.querySelector('.text-green-600')).toBeInTheDocument()
  })

  it('reverts to Copy icon after 2 seconds', async () => {
    jest.useFakeTimers()
    setupMocks({ token: TOKEN })
    render(<SelfInviteLinkManager />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy invite link' }))
    })
    expect(
      screen.getByRole('button', { name: 'Copied!' }).querySelector('.text-green-600')
    ).toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(2000)
    })
    expect(
      screen.getByRole('button', { name: 'Copy invite link' }).querySelector('.text-green-600')
    ).not.toBeInTheDocument()

    jest.useRealTimers()
  })

  it('shows error toast and does not enter copied state when clipboard.writeText rejects', async () => {
    mockWriteText.mockRejectedValueOnce(new Error('Clipboard denied'))
    setupMocks({ token: TOKEN })
    render(<SelfInviteLinkManager />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy invite link' }))
    })
    // setCopied(true) is never reached → no green check icon
    expect(
      screen.getByRole('button', { name: 'Copy invite link' }).querySelector('.text-green-600')
    ).not.toBeInTheDocument()
    expect(mockToastError).toHaveBeenCalledWith('Failed to copy link')
  })
})

// ── generateToken mutation: click, toasts, refetch, pending ───────────────
describe('generateToken mutation', () => {
  it('calls mutate({}) when "Generate Invite Link" is clicked (no-token state)', () => {
    setupMocks()
    render(<SelfInviteLinkManager />)
    fireEvent.click(screen.getByRole('button', { name: /generate invite link/i }))
    expect(mockGenerateMutate).toHaveBeenCalledWith({})
  })

  it('calls mutate({}) when Reset button is clicked (token state)', () => {
    setupMocks({ token: TOKEN })
    render(<SelfInviteLinkManager />)
    fireEvent.click(screen.getByRole('button', { name: 'Reset invite link' }))
    expect(mockGenerateMutate).toHaveBeenCalledWith({})
  })

  it('calls refetch on success', () => {
    setupMocks()
    render(<SelfInviteLinkManager />)
    act(() => {
      capturedGenerateOnSuccess?.()
    })
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('shows success toast on success', () => {
    setupMocks()
    render(<SelfInviteLinkManager />)
    act(() => {
      capturedGenerateOnSuccess?.()
    })
    expect(mockToastSuccess).toHaveBeenCalledWith('Invite link generated!')
  })

  it('shows error toast on failure', () => {
    setupMocks()
    render(<SelfInviteLinkManager />)
    act(() => {
      capturedGenerateOnError?.()
    })
    expect(mockToastError).toHaveBeenCalledWith('Failed to generate invite link')
  })
})

// ── revokeToken mutation: click, toasts, refetch, pending disabled ─────────
describe('revokeToken mutation', () => {
  it('calls mutate({}) when Revoke button is clicked', () => {
    setupMocks({ token: TOKEN })
    render(<SelfInviteLinkManager />)
    fireEvent.click(screen.getByRole('button', { name: 'Revoke invite link' }))
    expect(mockRevokeMutate).toHaveBeenCalledWith({})
  })

  it('does not call mutate when Revoke button is disabled (pending)', () => {
    setupMocks({ token: TOKEN, revokeIsPending: true })
    render(<SelfInviteLinkManager />)
    fireEvent.click(screen.getByRole('button', { name: 'Revoke invite link' }))
    expect(mockRevokeMutate).not.toHaveBeenCalled()
  })

  it('calls refetch on success', () => {
    setupMocks({ token: TOKEN })
    render(<SelfInviteLinkManager />)
    act(() => {
      capturedRevokeOnSuccess?.()
    })
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('shows success toast on success', () => {
    setupMocks({ token: TOKEN })
    render(<SelfInviteLinkManager />)
    act(() => {
      capturedRevokeOnSuccess?.()
    })
    expect(mockToastSuccess).toHaveBeenCalledWith('Invite link revoked')
  })

  it('shows error toast on failure', () => {
    setupMocks({ token: TOKEN })
    render(<SelfInviteLinkManager />)
    act(() => {
      capturedRevokeOnError?.()
    })
    expect(mockToastError).toHaveBeenCalledWith('Failed to revoke invite link')
  })
})

// ── Copy aria-label updates ─────────────────────────────────────────────────
describe('copy aria-label', () => {
  it('aria-label updates to "Copied!" after successful copy', async () => {
    setupMocks({ token: TOKEN })
    render(<SelfInviteLinkManager />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy invite link' }))
    })
    expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument()
  })

  it('aria-label reverts to "Copy invite link" after 2 seconds', async () => {
    jest.useFakeTimers()
    setupMocks({ token: TOKEN })
    render(<SelfInviteLinkManager />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy invite link' }))
    })
    expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(2000)
    })
    expect(screen.getByRole('button', { name: 'Copy invite link' })).toBeInTheDocument()

    jest.useRealTimers()
  })
})

// ── Expiry warning ──────────────────────────────────────────────────────────
describe('expiry warning', () => {
  it('shows warning when expiresAt is before earliestEventDate', () => {
    setupMocks({
      token: TOKEN,
      expiresAt: '2026-05-01T00:00:00.000Z',
      earliestEventDate: '2026-06-01T00:00:00.000Z',
    })
    render(<SelfInviteLinkManager />)
    expect(screen.getByText('This link expires before your earliest event')).toBeInTheDocument()
  })

  it('does not show warning when expiresAt is after earliestEventDate', () => {
    setupMocks({
      token: TOKEN,
      expiresAt: '2026-07-01T00:00:00.000Z',
      earliestEventDate: '2026-06-01T00:00:00.000Z',
    })
    render(<SelfInviteLinkManager />)
    expect(
      screen.queryByText('This link expires before your earliest event')
    ).not.toBeInTheDocument()
  })

  it('does not show warning when earliestEventDate is null', () => {
    setupMocks({
      token: TOKEN,
      expiresAt: '2026-05-01T00:00:00.000Z',
      earliestEventDate: null,
    })
    render(<SelfInviteLinkManager />)
    expect(
      screen.queryByText('This link expires before your earliest event')
    ).not.toBeInTheDocument()
  })

  it('does not show warning when expiresAt is null', () => {
    setupMocks({
      token: TOKEN,
      expiresAt: null,
      earliestEventDate: '2026-06-01T00:00:00.000Z',
    })
    render(<SelfInviteLinkManager />)
    expect(
      screen.queryByText('This link expires before your earliest event')
    ).not.toBeInTheDocument()
  })
})
