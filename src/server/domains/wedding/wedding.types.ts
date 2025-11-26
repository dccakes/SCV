/**
 * Wedding Domain - Types
 *
 * Type definitions for the Wedding domain entity.
 * Wedding is the root entity containing all wedding-related data.
 */

/**
 * Core Wedding entity type
 */
export type Wedding = {
  id: string
  groomFirstName: string
  groomLastName: string
  brideFirstName: string
  brideLastName: string
  enabledAddOns: string[] // e.g., ["website", "tasks", "gifts"]
  createdAt: Date
  updatedAt: Date
}

/**
 * UserWedding join table type (many-to-many relationship)
 */
export type UserWedding = {
  id: string
  userId: string
  weddingId: string
  role: string // e.g., "owner", "editor", "viewer"
  isPrimary: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Input for creating a new wedding (during onboarding)
 */
export type CreateWeddingInput = {
  userId: string
  groomFirstName: string
  groomLastName: string
  brideFirstName: string
  brideLastName: string
  hasWeddingDetails?: boolean
  weddingDate?: string
  weddingLocation?: string
}

/**
 * Input for updating wedding settings
 */
export type UpdateWeddingInput = {
  groomFirstName?: string
  groomLastName?: string
  brideFirstName?: string
  brideLastName?: string
  enabledAddOns?: string[]
}
