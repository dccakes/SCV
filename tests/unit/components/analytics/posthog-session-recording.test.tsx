import { render } from '@testing-library/react'

jest.mock('~/lib/analytics/posthog-client', () => ({
  setPostHogSessionRecording: jest.fn(),
}))

import { PostHogSessionRecording } from '~/components/analytics/posthog-session-recording'
import { setPostHogSessionRecording } from '~/lib/analytics/posthog-client'

describe('PostHogSessionRecording', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('applies recording mode and resets to disabled on unmount', () => {
    const { unmount } = render(<PostHogSessionRecording enabled />)

    expect(setPostHogSessionRecording).toHaveBeenCalledWith(true)

    unmount()
    expect(setPostHogSessionRecording).toHaveBeenLastCalledWith(false)
  })
})
