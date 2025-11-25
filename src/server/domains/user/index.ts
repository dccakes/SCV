/**
 * User Domain - Barrel Export
 *
 * Exports all user domain components for use throughout the application.
 */

import { db } from '~/server/infrastructure/database'

import { UserRepository } from './user.repository'
import { UserService } from './user.service'

// Create singleton instances
const userRepository = new UserRepository(db)
export const userService = new UserService(userRepository)

// Export types
export type { User, CreateUserInput, UpdateUserInput, UserWithWebsite } from './user.types'

// Export validators
export {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  type CreateUserSchemaInput,
  type UpdateUserSchemaInput,
} from './user.validator'

// Export classes for testing/DI
export { UserRepository } from './user.repository'
export { UserService } from './user.service'

// Export router
export { userRouter } from './user.router'
