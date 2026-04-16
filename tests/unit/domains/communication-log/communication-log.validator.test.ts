/**
 * Tests for Communication Log Domain Validators
 */

import {
  addNoteSchema,
  deleteNoteSchema,
  getByHouseholdIdSchema,
} from '~/server/domains/communication-log/communication-log.validator'

describe('Communication Log Validators', () => {
  describe('getByHouseholdIdSchema', () => {
    it('accepts a valid household ID', () => {
      const result = getByHouseholdIdSchema.safeParse({ householdId: 'household-123' })
      expect(result.success).toBe(true)
    })

    it('rejects an empty household ID', () => {
      const result = getByHouseholdIdSchema.safeParse({ householdId: '' })
      expect(result.success).toBe(false)
    })

    it('rejects missing household ID', () => {
      const result = getByHouseholdIdSchema.safeParse({})
      expect(result.success).toBe(false)
    })
  })

  describe('addNoteSchema', () => {
    it('accepts valid input', () => {
      const result = addNoteSchema.safeParse({
        householdId: 'household-123',
        message: 'Called to follow up on RSVP',
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty message', () => {
      const result = addNoteSchema.safeParse({
        householdId: 'household-123',
        message: '',
      })
      expect(result.success).toBe(false)
    })

    it('rejects message over 2000 characters', () => {
      const result = addNoteSchema.safeParse({
        householdId: 'household-123',
        message: 'x'.repeat(2001),
      })
      expect(result.success).toBe(false)
    })

    it('accepts message at exactly 2000 characters', () => {
      const result = addNoteSchema.safeParse({
        householdId: 'household-123',
        message: 'x'.repeat(2000),
      })
      expect(result.success).toBe(true)
    })

    it('rejects missing household ID', () => {
      const result = addNoteSchema.safeParse({ message: 'Some note' })
      expect(result.success).toBe(false)
    })
  })

  describe('deleteNoteSchema', () => {
    it('accepts a valid note ID', () => {
      const result = deleteNoteSchema.safeParse({ noteId: 'note-123' })
      expect(result.success).toBe(true)
    })

    it('rejects an empty note ID', () => {
      const result = deleteNoteSchema.safeParse({ noteId: '' })
      expect(result.success).toBe(false)
    })
  })
})
