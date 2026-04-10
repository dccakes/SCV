/**
 * Tests for Invitation Domain Validators
 */

import {
  bulkUpdateInvitationsSchema,
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

describe('bulkUpdateInvitationsSchema', () => {
  it('should validate a valid bulk update input', () => {
    const validInput = {
      invitations: [
        { guestId: 1, eventId: 'event-123', rsvp: 'Invited' },
        { guestId: 2, eventId: 'event-123', rsvp: 'Invited' },
      ],
    }

    const result = bulkUpdateInvitationsSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    expect(result.data).toEqual(validInput)
  })

  it('should validate a single invitation in array', () => {
    const validInput = {
      invitations: [{ guestId: 1, eventId: 'event-123', rsvp: 'Invited' }],
    }

    const result = bulkUpdateInvitationsSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should reject empty invitations array', () => {
    const invalidInput = { invitations: [] }

    const result = bulkUpdateInvitationsSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should reject missing invitations field', () => {
    const invalidInput = {}

    const result = bulkUpdateInvitationsSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should reject items with empty eventId', () => {
    const invalidInput = {
      invitations: [{ guestId: 1, eventId: '', rsvp: 'Invited' }],
    }

    const result = bulkUpdateInvitationsSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should reject items missing guestId', () => {
    const invalidInput = {
      invitations: [{ eventId: 'event-123', rsvp: 'Invited' }],
    }

    const result = bulkUpdateInvitationsSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should accept different RSVP values in bulk', () => {
    const validInput = {
      invitations: [
        { guestId: 1, eventId: 'event-123', rsvp: 'Invited' },
        { guestId: 2, eventId: 'event-123', rsvp: 'Not Invited' },
      ],
    }

    const result = bulkUpdateInvitationsSchema.safeParse(validInput)
    expect(result.success).toBe(true)
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
