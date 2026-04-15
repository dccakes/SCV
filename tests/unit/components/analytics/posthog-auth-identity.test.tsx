import { render } from '@testing-library/react'

jest.mock('~/lib/analytics/posthog-client', () => ({
  identifyClientUser: jest.fn(),
}))

import { PostHogAuthIdentity } from '~/components/analytics/posthog-auth-identity'
import { identifyClientUser } from '~/lib/analytics/posthog-client'

describe('PostHogAuthIdentity', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('identifies on first mount and dedupes identical rerenders', () => {
    const { rerender } = render(
      <PostHogAuthIdentity userId='user_1' email='user@example.com' weddingId='wed_1' />
    )

    expect(identifyClientUser).toHaveBeenCalledTimes(1)

    rerender(<PostHogAuthIdentity userId='user_1' email='user@example.com' weddingId='wed_1' />)
    expect(identifyClientUser).toHaveBeenCalledTimes(1)

    rerender(<PostHogAuthIdentity userId='user_1' email='user@example.com' weddingId='wed_2' />)
    expect(identifyClientUser).toHaveBeenCalledTimes(2)
  })
})
