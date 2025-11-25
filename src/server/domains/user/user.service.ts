/**
 * User Domain - Service
 *
 * Business logic for the User domain.
 * Handles authorization checks and orchestrates repository calls.
 */

import { TRPCError } from '@trpc/server'

import { type UpdateUserInput, type User } from './user.types'
import { type UserRepository } from './user.repository'

export class UserService {
  constructor(private userRepository: UserRepository) {}

  /**
   * Get the current authenticated user
   */
  async getCurrentUser(userId: string | null): Promise<User | null> {
    if (!userId) {
      return null
    }
    return this.userRepository.findById(userId)
  }

  /**
   * Get a user by ID (with authorization check)
   * Users can only access their own data
   */
  async getById(userId: string, requestingUserId: string): Promise<User> {
    // Users can only access their own data
    if (userId !== requestingUserId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only access your own user data',
      })
    }

    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }

    return user
  }

  /**
   * Update user profile
   * Users can only update their own profile
   */
  async updateProfile(
    userId: string,
    requestingUserId: string,
    data: UpdateUserInput
  ): Promise<User> {
    // Users can only update their own profile
    if (userId !== requestingUserId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only update your own profile',
      })
    }

    // Check if user exists
    const exists = await this.userRepository.exists(userId)
    if (!exists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }

    return this.userRepository.update(userId, data)
  }

  /**
   * Check if a user exists
   */
  async exists(userId: string): Promise<boolean> {
    return this.userRepository.exists(userId)
  }
}
