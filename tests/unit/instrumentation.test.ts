jest.mock('@vercel/otel', () => ({
  registerOTel: jest.fn(),
}))

import { onRequestError } from '~/instrumentation'

describe('instrumentation', () => {
  it('logs request errors through the Edge-compatible console API', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation()
    const stderrWrite = jest.spyOn(process.stderr, 'write').mockImplementation(() => true)

    await onRequestError(
      Object.assign(new Error('request failed'), { digest: 'digest-123' }),
      { method: 'GET', path: '/events' },
      {
        routePath: '/events',
        routeType: 'render',
        routerKind: 'App Router',
      }
    )

    expect(consoleError).toHaveBeenCalledWith(
      JSON.stringify({
        digest: 'digest-123',
        message: 'request failed',
        method: 'GET',
        path: '/events',
        routePath: '/events',
        routeType: 'render',
        routerKind: 'App Router',
        tag: 'scv:error',
      })
    )
    expect(stderrWrite).not.toHaveBeenCalled()
  })
})
