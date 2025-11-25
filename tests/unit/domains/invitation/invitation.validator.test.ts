/**
 * Tests for Invitation Domain Validators
 */

import {
  createInvitationSchema,
  invitationIdSchema,
  updateInvitationSchema,
} from '~/server/domains/invitation/invitation.validator'

describe('createInvitationSchema', () => {
  it('should validate a valid invitation creation input', () => {
    const validInput = {
      guestId: 1,
      eventId: 'event-123',
      rsvp: 'Invited',
    }

    const result = createInvitationSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    expect(result.data).toEqual(validInput)
  })

  it('should require guestId', () => {
    const invalidInput = {
      eventId: 'event-123',
      rsvp: 'Invited',
    }

    const result = createInvitationSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require eventId', () => {
    const invalidInput = {
      guestId: 1,
      rsvp: 'Invited',
    }

    const result = createInvitationSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require non-empty eventId', () => {
    const invalidInput = {
      guestId: 1,
      eventId: '',
      rsvp: 'Invited',
    }

    const result = createInvitationSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require rsvp', () => {
    const invalidInput = {
      guestId: 1,
      eventId: 'event-123',
    }

    const result = createInvitationSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })
})

describe('updateInvitationSchema', () => {
  it('should validate a valid invitation update input', () => {
    const validInput = {
      guestId: 1,
      eventId: 'event-123',
      rsvp: 'Attending',
    }

    const result = updateInvitationSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should accept different RSVP values', () => {
    const statuses = ['Not Invited', 'Invited', 'Attending', 'Declined']

    statuses.forEach((rsvp) => {
      const result = updateInvitationSchema.safeParse({
        guestId: 1,
        eventId: 'event-123',
        rsvp,
      })
      expect(result.success).toBe(true)
    })
  })
})

describe('invitationIdSchema', () => {
  it('should validate valid compound ID', () => {
    const validInput = {
      guestId: 1,
      eventId: 'event-123',
    }

    const result = invitationIdSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should require guestId to be a number', () => {
    const invalidInput = {
      guestId: 'not-a-number',
      eventId: 'event-123',
    }

    const result = invitationIdSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require non-empty eventId', () => {
    const invalidInput = {
      guestId: 1,
      eventId: '',
    }

    const result = invitationIdSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })
})
