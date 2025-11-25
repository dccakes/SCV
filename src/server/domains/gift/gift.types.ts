/**
 * Gift Domain - Types
 *
 * Type definitions for the Gift domain entity.
 * Gifts track presents received per household per event.
 */

/**
 * Core Gift entity type
 */
export type Gift = {
  householdId: string
  eventId: string
  description: string | null
  thankyou: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Input for updating a gift
 */
export type UpdateGiftInput = {
  householdId: string
  eventId: string
  description?: string
  thankyou: boolean
}

/**
 * Input for creating a gift
 */
export type CreateGiftInput = {
  householdId: string
  eventId: string
  description?: string
  thankyou?: boolean
}

/**
 * Input for upserting a gift (create or update)
 */
export type UpsertGiftInput = {
  householdId: string
  eventId: string
  description?: string | null
  thankyou: boolean
}
