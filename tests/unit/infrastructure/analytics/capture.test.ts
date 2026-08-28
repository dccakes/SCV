// Mock the PostHog client module so the ESM-only `posthog-node` dependency is
// never loaded by Jest. We only exercise the pure `buildEventProperties` here.
jest.mock('~/server/infrastructure/analytics/posthog-server', () => ({
  getPostHogServer: () => null,
}))

import type { ResolvedAnalyticsContext } from '~/server/infrastructure/analytics/analytics-context'
import { buildEventProperties } from '~/server/infrastructure/analytics/capture'

const authedContext: ResolvedAnalyticsContext = {
  distinctId: 'user_1',
  isAuthenticated: true,
  userId: 'user_1',
  weddingId: 'wed_1',
}

const anonContext: ResolvedAnalyticsContext = {
  distinctId: 'tok_1',
  isAuthenticated: false,
  token: 'tok_1',
  weddingId: 'wed_2',
  householdId: 'hh_1',
  subUrl: 'jack-and-jill',
}

describe('buildEventProperties', () => {
  it('always attaches wedding_id and marks the backend source', () => {
    const props = buildEventProperties({ context: authedContext })
    expect(props.wedding_id).toBe('wed_1')
    expect(props.source).toBe('backend')
    expect(props.is_authenticated).toBe(true)
  })

  it('creates person profiles only for authenticated actors', () => {
    expect(buildEventProperties({ context: authedContext }).$process_person_profile).toBe(true)
    expect(buildEventProperties({ context: anonContext }).$process_person_profile).toBe(false)
  })

  it('includes guest token, household, and website slug for anonymous flows', () => {
    const props = buildEventProperties({ context: anonContext })
    expect(props.guest_token).toBe('tok_1')
    expect(props.household_id).toBe('hh_1')
    expect(props.website_sub_url).toBe('jack-and-jill')
  })

  it('merges extra properties (e.g. payload) over the base context', () => {
    const props = buildEventProperties({
      context: authedContext,
      properties: { payload: { name: 'Smith' }, trpc_path: 'household.create' },
    })
    expect(props.payload).toEqual({ name: 'Smith' })
    expect(props.trpc_path).toBe('household.create')
  })

  it('nulls out missing identifiers rather than omitting them', () => {
    const props = buildEventProperties({
      context: { distinctId: 'anonymous', isAuthenticated: false },
    })
    expect(props.wedding_id).toBeNull()
    expect(props.guest_token).toBeNull()
    expect(props.household_id).toBeNull()
  })
})
