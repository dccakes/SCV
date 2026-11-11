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

  it('tags every browser event, from the first one, with the deployment environment and version', () => {
    loadWithToken('phc_test')
    // Registered in `loaded`, which runs before posthog-js sends its first event.
    const { loaded } = mockInit.mock.calls.at(-1)?.[1] as { loaded: (ph: unknown) => void }
    const instance = { register: jest.fn() }
    loaded(instance)
    expect(instance.register).toHaveBeenCalledWith({
      environment: 'development',
      app_version: 'development',
    })
  })
})
