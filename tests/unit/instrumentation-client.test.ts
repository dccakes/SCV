const mockInit = jest.fn()
jest.mock('posthog-js', () => ({
  __esModule: true,
  default: {
    init: (...a: unknown[]) => mockInit(...a),
  },
}))
jest.mock('~/lib/observability/browser-tracing', () => ({ initBrowserTracing: jest.fn() }))

const loadWithToken = (token: string | undefined) => {
  const saved = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  if (token === undefined) delete process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  else process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = token
  try {
    jest.isolateModules(() => {
      require('../../instrumentation-client')
    })
  } finally {
    if (saved === undefined) delete process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
    else process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = saved
  }
}

describe('instrumentation-client', () => {
  beforeEach(() => mockInit.mockClear())

  it('does not start PostHog without a project token', () => {
    loadWithToken(undefined)
    expect(mockInit).not.toHaveBeenCalled()
  })

  it('starts PostHog through the reverse proxy with current defaults and error tracking', () => {
    loadWithToken('phc_test')

    expect(mockInit).toHaveBeenCalledWith(
      'phc_test',
      expect.objectContaining({
        api_host: '/oswp-pHsc1',
        // Latest config snapshot: hash-free URLs, JSON-LD in replay, cookie wins on conflict.
        defaults: '2026-08-30',
        capture_exceptions: true,
        // Only signed-in users get person profiles; guests stay anonymous.
        person_profiles: 'identified_only',
        tracing_headers: [window.location.hostname],
      })
    )
  })

  const registeredProperties = () => {
    const { loaded } = mockInit.mock.calls.at(-1)?.[1] as { loaded: (ph: unknown) => void }
    const instance = { register: jest.fn() }
    loaded(instance)
    return instance.register.mock.calls[0]?.[0]
  }

  it('tags every browser event, from the first one, with the deployed version', () => {
    // Registered in `loaded`, which runs before posthog-js sends its first event.
    process.env.NEXT_PUBLIC_APP_VERSION = 'abc123'
    try {
      loadWithToken('phc_test')
    } finally {
      delete process.env.NEXT_PUBLIC_APP_VERSION
    }
    expect(registeredProperties()).toEqual({ environment: 'development', app_version: 'abc123' })
  })

  it('omits app_version when the commit is unknown, matching server events (Docker, self-hosted)', () => {
    loadWithToken('phc_test')
    expect(registeredProperties()).toEqual({ environment: 'development' })
  })
})
