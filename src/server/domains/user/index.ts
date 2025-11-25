/**
 * User Domain - Barrel Export
 *
 * Exports all user domain components for use throughout the application.
 */

import { UserRepository } from '~/server/domains/user/user.repository'
import { UserService } from '~/server/domains/user/user.service'
import { db } from '~/server/infrastructure/database'

// Create singleton instances
const userRepository = new UserRepository(db)
export const userService = new UserService(userRepository)

// Export types
export type { CreateUserInput, UpdateUserInput, User, UserWithWebsite } from '~/server/domains/user/user.types'

// Export validators
export {
  createUserSchema,
  type CreateUserSchemaInput,
  updateUserSchema,
  type UpdateUserSchemaInput,
  userIdSchema,
} from '~/server/domains/user/user.validator'

// Export classes for testing/DI
export { UserRepository } from '~/server/domains/user/user.repository'
export { UserService } from '~/server/domains/user/user.service'

// Export router
export { userRouter } from '~/server/domains/user/user.router'
