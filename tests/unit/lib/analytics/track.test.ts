import { buildClientEventProperties } from '~/lib/analytics/track'

describe('buildClientEventProperties', () => {
  it('marks the frontend source and passes through known identifiers', () => {
    const props = buildClientEventProperties(
      { weddingId: 'wed_1', token: 'tok_1', householdId: 'hh_1', subUrl: 'jack-and-jill' },
      { rsvpStatus: 'attending' }
    )
    expect(props.source).toBe('frontend')
    expect(props.wedding_id).toBe('wed_1')
    expect(props.guest_token).toBe('tok_1')
    expect(props.household_id).toBe('hh_1')
    expect(props.website_sub_url).toBe('jack-and-jill')
    expect(props.rsvpStatus).toBe('attending')
  })

  it('omits identifier keys that are not provided (rather than sending null noise)', () => {
    const props = buildClientEventProperties({ weddingId: 'wed_1' })
    expect(props.wedding_id).toBe('wed_1')
    expect('guest_token' in props).toBe(false)
    expect('household_id' in props).toBe(false)
  })

  it('returns just the source marker when no context or props are given', () => {
    expect(buildClientEventProperties()).toEqual({ source: 'frontend' })
  })
})
