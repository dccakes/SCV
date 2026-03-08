/**
 * Tests for bulkCreateHouseholdsSchema (household domain validator)
 *
 * Covers: valid input with one or more households, empty households array,
 * missing guestParty, and the inherited createHouseholdSchema constraints
 * (primary contact requirement, email format).
 */

import { bulkCreateHouseholdsSchema } from '~/server/domains/household/household.validator'

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const VALID_GUEST = {
  firstName: 'John',
  lastName: 'Doe',
  isPrimaryContact: true,
  invites: { 'event-123': 'Invited' },
}

const VALID_HOUSEHOLD = {
  guestParty: [VALID_GUEST],
}

const VALID_HOUSEHOLD_WITH_ADDRESS = {
  address1: '123 Main St',
  address2: 'Apt 4',
  city: 'New York',
  state: 'NY',
  country: 'USA',
  zipCode: '10001',
  phone: '555-1234',
  email: 'family@example.com',
  notes: 'Seat near the aisle',
  guestParty: [VALID_GUEST],
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('bulkCreateHouseholdsSchema', () => {
  describe('valid input', () => {
    it('should accept a single valid household', () => {
      const result = bulkCreateHouseholdsSchema.safeParse({
        households: [VALID_HOUSEHOLD],
      })

      expect(result.success).toBe(true)
      expect(result.data?.households).toHaveLength(1)
    })

    it('should accept multiple valid households', () => {
      const secondHousehold = {
        guestParty: [
          {
            firstName: 'Jane',
            lastName: 'Smith',
            isPrimaryContact: true,
            invites: { 'event-123': 'Invited' },
          },
        ],
      }

      const result = bulkCreateHouseholdsSchema.safeParse({
        households: [VALID_HOUSEHOLD, secondHousehold],
      })

      expect(result.success).toBe(true)
      expect(result.data?.households).toHaveLength(2)
    })

    it('should accept households with full address and contact fields', () => {
      const result = bulkCreateHouseholdsSchema.safeParse({
        households: [VALID_HOUSEHOLD_WITH_ADDRESS],
      })

      expect(result.success).toBe(true)
      expect(result.data?.households[0]).toMatchObject({
        address1: '123 Main St',
        city: 'New York',
        email: 'family@example.com',
      })
    })

    it('should accept a household with multiple guests when exactly one is primary contact', () => {
      const result = bulkCreateHouseholdsSchema.safeParse({
        households: [
          {
            guestParty: [
              { firstName: 'John', lastName: 'Doe', isPrimaryContact: true, invites: {} },
              { firstName: 'Jane', lastName: 'Doe', isPrimaryContact: false, invites: {} },
            ],
          },
        ],
      })

      expect(result.success).toBe(true)
    })

    it('should accept null values for optional household fields', () => {
      const result = bulkCreateHouseholdsSchema.safeParse({
        households: [
          {
            address1: null,
            address2: null,
            city: null,
            state: null,
            country: null,
            zipCode: null,
            phone: null,
            notes: null,
            guestParty: [VALID_GUEST],
          },
        ],
      })

      expect(result.success).toBe(true)
    })
  })

  describe('empty households array', () => {
    it('should reject an empty households array', () => {
      const result = bulkCreateHouseholdsSchema.safeParse({ households: [] })

      expect(result.success).toBe(false)
    })

    it('should report the correct error message for an empty households array', () => {
      const result = bulkCreateHouseholdsSchema.safeParse({ households: [] })

      expect(result.success).toBe(false)
      const messages = result.error?.issues.map((i) => i.message) ?? []
      expect(messages.some((m) => /at least one household/i.test(m))).toBe(true)
    })
  })

  describe('missing or invalid guestParty', () => {
    it('should reject a household missing guestParty entirely', () => {
      const result = bulkCreateHouseholdsSchema.safeParse({
        households: [{ address1: '123 Main St' }],
      })

      expect(result.success).toBe(false)
    })

    it('should reject a household with an empty guestParty array', () => {
      const result = bulkCreateHouseholdsSchema.safeParse({
        households: [{ guestParty: [] }],
      })

      expect(result.success).toBe(false)
    })

    it('should report an error when no primary contact is set', () => {
      // createHouseholdSchema requires exactly one isPrimaryContact = true
      const result = bulkCreateHouseholdsSchema.safeParse({
        households: [
          {
            guestParty: [
              { firstName: 'John', lastName: 'Doe', isPrimaryContact: false, invites: {} },
            ],
          },
        ],
      })

      expect(result.success).toBe(false)
      const messages = result.error?.issues.map((i) => i.message) ?? []
      expect(messages.some((m) => /primary contact/i.test(m))).toBe(true)
    })

    it('should reject when more than one guest is marked as primary contact', () => {
      const result = bulkCreateHouseholdsSchema.safeParse({
        households: [
          {
            guestParty: [
              { firstName: 'John', lastName: 'Doe', isPrimaryContact: true, invites: {} },
              { firstName: 'Jane', lastName: 'Doe', isPrimaryContact: true, invites: {} },
            ],
          },
        ],
      })

      expect(result.success).toBe(false)
      const messages = result.error?.issues.map((i) => i.message) ?? []
      expect(messages.some((m) => /primary contact/i.test(m))).toBe(true)
    })

    it('should reject a guest with an empty firstName inside a household', () => {
      const result = bulkCreateHouseholdsSchema.safeParse({
        households: [
          {
            guestParty: [
              { firstName: '', lastName: 'Doe', isPrimaryContact: true, invites: {} },
            ],
          },
        ],
      })

      expect(result.success).toBe(false)
    })

    it('should reject a guest with an empty lastName inside a household', () => {
      const result = bulkCreateHouseholdsSchema.safeParse({
        households: [
          {
            guestParty: [
              { firstName: 'John', lastName: '', isPrimaryContact: true, invites: {} },
            ],
          },
        ],
      })

      expect(result.success).toBe(false)
    })
  })

  describe('email validation on the household level', () => {
    it('should reject an invalid household email', () => {
      const result = bulkCreateHouseholdsSchema.safeParse({
        households: [
          {
            email: 'not-an-email',
            guestParty: [VALID_GUEST],
          },
        ],
      })

      expect(result.success).toBe(false)
    })

    it('should accept a valid household email', () => {
      const result = bulkCreateHouseholdsSchema.safeParse({
        households: [
          {
            email: 'contact@family.com',
            guestParty: [VALID_GUEST],
          },
        ],
      })

      expect(result.success).toBe(true)
    })
  })

  describe('top-level structure', () => {
    it('should reject when the households key is missing', () => {
      const result = bulkCreateHouseholdsSchema.safeParse({})

      expect(result.success).toBe(false)
    })

    it('should reject when households is not an array', () => {
      const result = bulkCreateHouseholdsSchema.safeParse({
        households: 'not-an-array',
      })

      expect(result.success).toBe(false)
    })
  })
})
