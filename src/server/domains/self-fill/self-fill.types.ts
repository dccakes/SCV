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
 *
 * Note: guestId is number because Guest.id is Int (autoincrement) in the schema.
 * householdId is string (UUID) because Household.id uses @default(uuid()).
 */
export type SelfFillRegistrationResult = {
  success: boolean
  guestId: number // Int (autoincrement) — matches Guest model schema
  householdId: string
  message: string
}

/**
 * Minimal interface for the guest registration dependency.
 * Defined in the domain so the router can depend on this abstraction
 * without importing from the application layer (clean architecture).
 */
export interface ISelfFillRegistration {
  registerGuest(token: string, data: SelfFillGuestInput): Promise<SelfFillRegistrationResult>
}
