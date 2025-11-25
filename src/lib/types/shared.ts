/**
 * Shared Types
 *
 * Cross-domain types used throughout the application.
 * These types are used by multiple domains and should not contain
 * domain-specific logic.
 */

/**
 * Pagination parameters for list queries
 */
export type PaginationParams = {
  page?: number
  limit?: number
}

/**
 * Paginated response wrapper
 */
export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Generic service result for operations that may fail
 */
export type ServiceResult<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E }

/**
 * Base entity type with common audit fields
 */
export type BaseEntity = {
  id: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Sort direction for queries
 */
export type SortDirection = 'asc' | 'desc'

/**
 * Generic sort parameters
 */
export type SortParams<T extends string> = {
  field: T
  direction: SortDirection
}
