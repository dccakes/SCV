/**
 * @jest-environment node
 */
jest.mock('server-only', () => ({}))
const mockPostHog = jest.fn()
jest.mock('posthog-node', () => ({
  PostHog: jest.fn().mockImplementation((...args: unknown[]) => mockPostHog(...args) ?? {}),
}))

const ENV_KEYS = [
  'POSTHOG_KEY',
  'POSTHOG_HOST',
  'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN',
  'NEXT_PUBLIC_POSTHOG_HOST',
] as const
const saved = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]))

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key]
    else process.env[key] = saved[key]
  }
})

const loadClient = () => {
  let getPostHogServer: () => unknown = () => null
  jest.isolateModules(() => {
    ;({ getPostHogServer } = require('~/server/infrastructure/analytics/posthog-server'))
  })
  return getPostHogServer()
}

describe('getPostHogServer', () => {
  it('is disabled without a project token', () => {
    for (const key of ENV_KEYS) delete process.env[key]
    expect(loadClient()).toBeNull()
    expect(mockPostHog).not.toHaveBeenCalled()
  })

  it('never sends server events to the UI host, matching the OTLP exporters', () => {
    for (const key of ENV_KEYS) delete process.env[key]
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = 'phc_pub'
    process.env.NEXT_PUBLIC_POSTHOG_HOST = 'https://us.posthog.com'

    loadClient()

    expect(mockPostHog).toHaveBeenCalledWith(
      'phc_pub',
      expect.objectContaining({ host: 'https://us.i.posthog.com' })
    )
  })

  it('uses POSTHOG_KEY and POSTHOG_HOST when set', () => {
    process.env.POSTHOG_KEY = 'phc_server'
    process.env.POSTHOG_HOST = 'https://eu.i.posthog.com'

    loadClient()

    expect(mockPostHog).toHaveBeenCalledWith(
      'phc_server',
      expect.objectContaining({ host: 'https://eu.i.posthog.com' })
    )
  })
})
