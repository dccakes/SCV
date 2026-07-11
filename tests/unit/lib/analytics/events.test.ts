import {
  ANALYTICS_ACTIONS,
  buildEventName,
  deriveEventName,
  resolveTrpcEventName,
  TRPC_EVENT_MAP,
} from '~/lib/analytics/events'

describe('analytics event taxonomy', () => {
  describe('buildEventName', () => {
    it('joins scope, object, and action with dots', () => {
      expect(buildEventName({ scope: 'guest_list', object: 'household', action: 'added' })).toBe(
        'guest_list.household.added'
      )
    })

    it('omits the object segment when not provided', () => {
      expect(buildEventName({ scope: 'event', action: 'removed' })).toBe('event.removed')
    })

    it('normalizes camelCase and spaces to snake_case segments', () => {
      expect(buildEventName({ scope: 'website', object: 'coverPhoto', action: 'updated' })).toBe(
        'website.cover_photo.updated'
      )
      expect(
        buildEventName({ scope: 'guest list', object: 'family member', action: 'added' })
      ).toBe('guest_list.family_member.added')
    })

    it('only allows canonical action verbs', () => {
      expect(Object.values(ANALYTICS_ACTIONS)).toContain('added')
      expect(Object.values(ANALYTICS_ACTIONS)).toContain('updated')
      expect(Object.values(ANALYTICS_ACTIONS)).toContain('removed')
    })
  })

  describe('TRPC_EVENT_MAP', () => {
    it('maps known mutation paths to canonical event names', () => {
      expect(TRPC_EVENT_MAP['household.create']).toBe('guest_list.household.added')
      expect(TRPC_EVENT_MAP['household.update']).toBe('guest_list.household.updated')
      expect(TRPC_EVENT_MAP['household.delete']).toBe('guest_list.household.removed')
      expect(TRPC_EVENT_MAP['vendor.saveQuoteFiles']).toBe('vendor.quote_file.uploaded')
      expect(TRPC_EVENT_MAP['website.submitPublicRsvpForm']).toBe(
        'rsvp.public_submission.submitted'
      )
      expect(TRPC_EVENT_MAP['selfFill.registerGuest']).toBe('self_fill.guest.registered')
    })

    it('produces only dot-delimited snake_case names', () => {
      for (const name of Object.values(TRPC_EVENT_MAP)) {
        expect(name).toMatch(/^[a-z0-9_]+(\.[a-z0-9_]+)+$/)
      }
    })
  })

  describe('deriveEventName', () => {
    it('derives a scope.action name from an unmapped path using verb heuristics', () => {
      expect(deriveEventName('gadget.create')).toBe('gadget.added')
      expect(deriveEventName('gadget.updateSomething')).toBe('gadget.something.updated')
      expect(deriveEventName('gadget.deleteThing')).toBe('gadget.thing.removed')
    })

    it('falls back to a generic action for unknown verbs', () => {
      expect(deriveEventName('gadget.frobnicate')).toBe('gadget.frobnicate.triggered')
    })
  })

  describe('resolveTrpcEventName', () => {
    it('prefers the explicit map over derivation', () => {
      expect(resolveTrpcEventName('household.create')).toBe('guest_list.household.added')
    })

    it('derives when the path is not mapped', () => {
      expect(resolveTrpcEventName('gadget.create')).toBe('gadget.added')
    })
  })
})
