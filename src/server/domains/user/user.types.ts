/**
 * User Domain - Types
 *
 * Type definitions for the User domain entity.
 * Users are managed by Better Auth and represent wedding couples.
 */

/**
 * Core User entity type
 */
export type User = {
  id: string
  name: string | null
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: Date
  updatedAt: Date
  websiteUrl: string | null
  groomFirstName: string | null
  groomLastName: string | null
  brideFirstName: string | null
  brideLastName: string | null
}

/**
 * Input for creating a new user (used during website setup)
 */
export type CreateUserInput = {
  id: string
  email: string
  websiteUrl?: string
  groomFirstName?: string
  groomLastName?: string
  brideFirstName?: string
  brideLastName?: string
}

/**
 * Input for updating user profile
 */
export type UpdateUserInput = {
  name?: string
  websiteUrl?: string
  groomFirstName?: string
  groomLastName?: string
  brideFirstName?: string
  brideLastName?: string
}

/**
 * User with related website data (used in dashboard)
 */
export type UserWithWebsite = User & {
  website?: {
    id: string
    url: string
    subUrl: string
  } | null
}
