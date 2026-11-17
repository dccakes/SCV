import { render } from '@testing-library/react'

const mockIdentify = jest.fn()
const mockReset = jest.fn()
const mockGetProperty = jest.fn()
jest.mock('posthog-js', () => ({
  __esModule: true,
  default: {
    __loaded: true,
    identify: (...a: unknown[]) => mockIdentify(...a),
    reset: (...a: unknown[]) => mockReset(...a),
    get_property: (...a: unknown[]) => mockGetProperty(...a),
  },
}))

type SessionState = {
  data: { user: { id: string; email: string; name: string } } | null
  isPending: boolean
  error: Error | null
}
let mockSession: SessionState
jest.mock('~/lib/auth-client', () => ({ useSession: () => mockSession }))

import { PostHogProvider } from '~/lib/analytics/posthog-client'

const mount = () => render(<PostHogProvider>child</PostHogProvider>)

describe('PostHog identity sync', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetProperty.mockReturnValue('anonymous')
  })

  it('identifies the signed-in user', () => {
    mockSession = {
      data: { user: { id: 'user-1', email: 'a@b.c', name: 'A' } },
      isPending: false,
      error: null,
    }
    mount()
    expect(mockIdentify).toHaveBeenCalledWith('user-1', { email: 'a@b.c', name: 'A' })
    expect(mockReset).not.toHaveBeenCalled()
  })

  it('resets a browser still identified after sign-out, even across a full page reload', () => {
    // Sign-out navigates with window.location, so this is a fresh mount.
    mockSession = { data: null, isPending: false, error: null }
    mockGetProperty.mockImplementation((key: string) =>
      key === '$user_state' ? 'identified' : undefined
    )
    mount()
    expect(mockReset).toHaveBeenCalledTimes(1)
  })

  it('leaves anonymous visitors (guests) alone', () => {
    mockSession = { data: null, isPending: false, error: null }
    mount()
    expect(mockReset).not.toHaveBeenCalled()
    expect(mockIdentify).not.toHaveBeenCalled()
  })

  it('does nothing while the session is loading or failed to load', () => {
    mockGetProperty.mockReturnValue('identified')
    mockSession = { data: null, isPending: true, error: null }
    mount()
    mockSession = { data: null, isPending: false, error: new Error('network') }
    mount()
    expect(mockReset).not.toHaveBeenCalled()
  })
})
