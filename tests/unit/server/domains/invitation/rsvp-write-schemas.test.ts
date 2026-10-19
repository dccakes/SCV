/**
 * Every write path that sets an RSVP status rejects values outside the
 * allowed list (openspec: rsvp-status).
 */
import {
  guestPartyInputSchema as appGuestPartyInputSchema,
  createHouseholdWithGuestsSchema,
} from '~/server/application/household-management/household-management.validator'
import {
  submitPublicRsvpSchema,
  submitRsvpSchema,
} from '~/server/application/rsvp-submission/rsvp-submission.validator'
import { guestPartySchema } from '~/server/domains/guest/guest.validator'
import {
  bulkCreateHouseholdsSchema,
  createHouseholdSchema,
} from '~/server/domains/household/household.validator'
import {
  createInvitationSchema,
  updateInvitationSchema,
} from '~/server/domains/invitation/invitation.validator'
import { submitRsvpSchema as websiteSubmitRsvpSchema } from '~/server/domains/website/website.validator'

const guest = (rsvp: string) => ({
  firstName: 'Ada',
  isPrimaryContact: true,
  invites: { 'event-1': rsvp },
})

describe('RSVP write schemas', () => {
  describe.each([
    ['createInvitationSchema', createInvitationSchema],
    ['updateInvitationSchema', updateInvitationSchema],
  ])('%s', (_name, schema) => {
    it('accepts an allowed status', () => {
      expect(schema.safeParse({ guestId: 1, eventId: 'e', rsvp: 'Attending' }).success).toBe(true)
    })

    it('rejects a status with different casing', () => {
      expect(schema.safeParse({ guestId: 1, eventId: 'e', rsvp: 'attending' }).success).toBe(false)
    })
  })

  describe.each([
    ['rsvp-submission submitRsvpSchema', submitRsvpSchema, {}],
    ['public submitPublicRsvpSchema', submitPublicRsvpSchema, { subUrl: 'harry' }],
    ['website submitRsvpSchema', websiteSubmitRsvpSchema, {}],
  ])('%s', (_name, schema, extra) => {
    const submission = (...statuses: string[]) => ({
      ...extra,
      rsvpResponses: statuses.map((rsvp, index) => ({ eventId: `e${index}`, guestId: 1, rsvp })),
      answersToQuestions: [],
    })

    it('accepts allowed statuses', () => {
      expect(schema.safeParse(submission('Attending', 'Declined')).success).toBe(true)
    })

    it('rejects the whole submission when one response is invalid', () => {
      expect(schema.safeParse(submission('Attending', 'Maybe')).success).toBe(false)
    })
  })

  describe.each([
    ['guest guestPartySchema', guestPartySchema],
    ['application guestPartyInputSchema', appGuestPartyInputSchema],
  ])('%s invites', (_name, schema) => {
    it('accepts an allowed invite status', () => {
      expect(schema.safeParse(guest('Not Invited')).success).toBe(true)
    })

    it('rejects an unknown invite status', () => {
      expect(schema.safeParse(guest('Pending')).success).toBe(false)
    })
  })

  describe.each([
    ['household createHouseholdSchema', createHouseholdSchema],
    ['application createHouseholdWithGuestsSchema', createHouseholdWithGuestsSchema],
  ])('%s', (_name, schema) => {
    it('accepts a valid invite status', () => {
      expect(schema.safeParse({ guestParty: [guest('Invited')] }).error?.issues ?? []).toEqual([])
    })

    it('rejects an invalid invite status', () => {
      expect(schema.safeParse({ guestParty: [guest('Pending')] }).success).toBe(false)
    })
  })

  it('rejects a bulk import when one guest has an invalid invite status', () => {
    expect(
      bulkCreateHouseholdsSchema.safeParse({
        households: [{ guestParty: [guest('Invited')] }, { guestParty: [guest('Yes')] }],
      }).success
    ).toBe(false)
  })

  it('accepts a bulk import with valid statuses', () => {
    const result = bulkCreateHouseholdsSchema.safeParse({
      households: [{ guestParty: [guest('Invited')] }, { guestParty: [guest('Not Invited')] }],
    })
    expect(result.error?.issues ?? []).toEqual([])
  })
})
