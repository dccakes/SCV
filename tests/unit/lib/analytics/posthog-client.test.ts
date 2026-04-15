var mockPosthogKey: string | undefined
var mockPosthogHost: string | undefined
var mockGroupAnalyticsEnabled = false

jest.mock('posthog-js', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    capture: jest.fn(),
    identify: jest.fn(),
    group: jest.fn(),
    set_config: jest.fn(),
    reset: jest.fn(),
  },
}))

jest.mock('~/env.js', () => ({
  env: {
    get NEXT_PUBLIC_POSTHOG_KEY() {
      return mockPosthogKey
    },
    get NEXT_PUBLIC_POSTHOG_HOST() {
      return mockPosthogHost
    },
    get NEXT_PUBLIC_POSTHOG_GROUP_ANALYTICS_ENABLED() {
      return mockGroupAnalyticsEnabled
    },
  },
}))

import {
  captureClientEvent,
  identifyClientUser,
  initPostHogClient,
  resetPostHogClientForTests,
  setPostHogSessionRecording,
} from '~/lib/analytics/posthog-client'

const mockPosthog = jest.requireMock('posthog-js').default as {
  init: jest.Mock
  capture: jest.Mock
  identify: jest.Mock
  group: jest.Mock
  set_config: jest.Mock
  reset: jest.Mock
}

describe('posthog-client', () => {
  beforeEach(() => {
    mockPosthogKey = undefined
    mockPosthogHost = undefined
    mockGroupAnalyticsEnabled = false
    resetPostHogClientForTests()
    jest.clearAllMocks()
  })

  it('does not initialize when env is missing', () => {
    expect(initPostHogClient()).toBe(false)
    expect(mockPosthog.init).not.toHaveBeenCalled()
  })

  it('initializes with disabled session recording by default', () => {
    mockPosthogKey = 'phc_test'
    mockPosthogHost = 'https://eu.i.posthog.com'

    expect(initPostHogClient()).toBe(true)
    expect(mockPosthog.init).toHaveBeenCalledWith(
      'phc_test',
      expect.objectContaining({
        api_host: 'https://eu.i.posthog.com',
        disable_session_recording: true,
      })
    )
  })

  it('captures only after initialization', () => {
    captureClientEvent('onboarding:wedding_created', { wedding_id: 'wed_1' })
    expect(mockPosthog.capture).not.toHaveBeenCalled()

    mockPosthogKey = 'phc_test'
    mockPosthogHost = 'https://eu.i.posthog.com'
    initPostHogClient()

    captureClientEvent('onboarding:wedding_created', { wedding_id: 'wed_1' })
    expect(mockPosthog.capture).toHaveBeenCalledWith('onboarding:wedding_created', {
      wedding_id: 'wed_1',
    })
  })

  it('identifies user and gates wedding group by feature flag', () => {
    mockPosthogKey = 'phc_test'
    mockPosthogHost = 'https://eu.i.posthog.com'
    initPostHogClient()

    identifyClientUser({
      userId: 'user_1',
      weddingId: 'wed_1',
      email: 'planner@example.com',
      name: 'Planner',
      createdAt: '2026-01-01T00:00:00.000Z',
    })

    expect(mockPosthog.identify).toHaveBeenCalledWith('user_1', {
      email: 'planner@example.com',
      name: 'Planner',
      created_at: '2026-01-01T00:00:00.000Z',
      wedding_id: 'wed_1',
    })
    expect(mockPosthog.group).not.toHaveBeenCalled()

    mockGroupAnalyticsEnabled = true
    identifyClientUser({ userId: 'user_1', weddingId: 'wed_1' })
    expect(mockPosthog.group).toHaveBeenCalledWith('wedding', 'wed_1', {
      wedding_id: 'wed_1',
    })
  })

  it('toggles session recording config only after init', () => {
    setPostHogSessionRecording(true)
    expect(mockPosthog.set_config).not.toHaveBeenCalled()

    mockPosthogKey = 'phc_test'
    mockPosthogHost = 'https://eu.i.posthog.com'
    initPostHogClient()

    setPostHogSessionRecording(true)
    expect(mockPosthog.set_config).toHaveBeenCalledWith({ disable_session_recording: false })

    setPostHogSessionRecording(false)
    expect(mockPosthog.set_config).toHaveBeenCalledWith({ disable_session_recording: true })
  })
})
