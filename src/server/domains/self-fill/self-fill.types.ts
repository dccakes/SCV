/**
 * Self-Fill Domain - Types
 *
 * Type definitions for the Self-Fill guest registration feature.
 * Allows guests to add themselves to a wedding via a shareable link.
 */

/**
 * Wedding data returned for the self-fill form
 */
export type SelfFillWeddingData = {
  id: string
  groomFirstName: string
  groomLastName: string
  brideFirstName: string
  brideLastName: string
  events: SelfFillEvent[]
}

/**
 * Event data for self-fill form (simplified)
 */
export type SelfFillEvent = {
  id: string
  name: string
  date: Date | null
  venue: string | null
}

/**
 * Input for guest self-registration
 */
export type SelfFillGuestInput = {
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
}

/**
 * Result of self-fill guest registration
 */
export type SelfFillRegistrationResult = {
  success: boolean
  guestId: number
  householdId: string
  message: string
}
