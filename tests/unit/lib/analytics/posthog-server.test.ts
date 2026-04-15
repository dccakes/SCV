var mockServerApiKey: string | undefined
var mockPosthogHost: string | undefined

jest.mock('posthog-node', () => ({
  PostHog: jest.fn().mockImplementation(() => ({
    capture: jest.fn(),
    shutdown: jest.fn().mockResolvedValue(undefined),
  })),
}))

jest.mock('~/env.js', () => ({
  env: {
    get POSTHOG_API_KEY() {
      return mockServerApiKey
    },
    get NEXT_PUBLIC_POSTHOG_HOST() {
      return mockPosthogHost
    },
  },
}))

import {
  captureServerEvent,
  getPostHogServerClient,
  resetPostHogServerClientForTests,
} from '~/lib/analytics/posthog-server'

const mockPostHogConstructor = jest.requireMock('posthog-node').PostHog as jest.Mock
const mockCapture = jest.fn()
const mockShutdown = jest.fn().mockResolvedValue(undefined)

describe('posthog-server', () => {
  beforeEach(async () => {
    mockServerApiKey = undefined
    mockPosthogHost = undefined
    jest.clearAllMocks()
    mockPostHogConstructor.mockImplementation(() => ({
      capture: mockCapture,
      shutdown: mockShutdown,
    }))
    await resetPostHogServerClientForTests()
  })

  it('returns null when server env vars are missing', () => {
    expect(getPostHogServerClient()).toBeNull()
    expect(mockPostHogConstructor).not.toHaveBeenCalled()
  })

  it('creates singleton server client when env vars are set', () => {
    mockServerApiKey = 'phx_server'
    mockPosthogHost = 'https://eu.i.posthog.com'

    const first = getPostHogServerClient()
    const second = getPostHogServerClient()

    expect(first).not.toBeNull()
    expect(first).toBe(second)
    expect(mockPostHogConstructor).toHaveBeenCalledTimes(1)
    expect(mockPostHogConstructor).toHaveBeenCalledWith('phx_server', {
      host: 'https://eu.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    })
  })

  it('captures server events as non-blocking side effects', async () => {
    mockServerApiKey = 'phx_server'
    mockPosthogHost = 'https://eu.i.posthog.com'

    await expect(
      captureServerEvent({
        distinctId: 'user_1',
        event: 'onboarding:wedding_created',
        properties: { wedding_id: 'wed_1' },
      })
    ).resolves.toBeUndefined()

    expect(mockCapture).toHaveBeenCalledWith({
      distinctId: 'user_1',
      event: 'onboarding:wedding_created',
      properties: { wedding_id: 'wed_1' },
    })
  })
})
