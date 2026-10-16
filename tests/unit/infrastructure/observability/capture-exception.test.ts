/**
 * @jest-environment node
 */
const mockCaptureException = jest.fn()
const mockFlush = jest.fn()
let mockClient: { captureException: jest.Mock; flush: jest.Mock } | null = null

jest.mock('~/server/infrastructure/analytics/posthog-server', () => ({
  getPostHogServer: () => mockClient,
}))

import { captureServerException } from '~/server/infrastructure/observability/capture-exception'

beforeEach(() => {
  mockClient = { captureException: mockCaptureException, flush: mockFlush }
  mockFlush.mockResolvedValue(undefined)
})

describe('captureServerException', () => {
  it('attributes to the authenticated user with session linkage and flushes immediately', async () => {
    const error = new Error('boom')
    await captureServerException(error, {
      userId: 'user_1',
      clientDistinctId: 'someone_else',
      sessionId: 'session_1',
      properties: { trace_id: 't1', span_id: 's1', source: 'trpc' },
    })

    expect(mockCaptureException).toHaveBeenCalledWith(error, 'user_1', {
      trace_id: 't1',
      span_id: 's1',
      source: 'trpc',
      $session_id: 'session_1',
      $process_person_profile: true,
    })
    expect(mockFlush).toHaveBeenCalled()
  })

  it('links anonymous guests by the client id without touching person profiles', async () => {
    await captureServerException(new Error('x'), { clientDistinctId: 'anon_1' })

    expect(mockCaptureException.mock.calls[0][1]).toBe('anon_1')
    expect(mockCaptureException.mock.calls[0][2]).toMatchObject({ $process_person_profile: false })
  })

  it('stays anonymous with no identity at all', async () => {
    await captureServerException(new Error('x'))
    expect(mockCaptureException.mock.calls[0][1]).toBeUndefined()
    expect(mockCaptureException.mock.calls[0][2]).toMatchObject({ $process_person_profile: false })
  })

  it('is a no-op without PostHog and never throws', async () => {
    mockClient = null
    await expect(captureServerException(new Error('x'))).resolves.toBeUndefined()

    mockClient = { captureException: mockCaptureException, flush: mockFlush }
    mockFlush.mockRejectedValue(new Error('network'))
    await expect(captureServerException(new Error('x'))).resolves.toBeUndefined()
  })
})
