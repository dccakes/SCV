/**
 * User Domain - Repository
 *
 * Database operations for the User entity.
 * This layer handles all direct database access for users.
 */

import { type PrismaClient } from '@prisma/client'

import { type CreateUserInput, type UpdateUserInput, type User } from '~/server/domains/user/user.types'

export class UserRepository {
  constructor(private db: PrismaClient) {}

  /**
   * Find a user by their ID
   */
  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { id },
    })
  }

  /**
   * Find a user by their email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { email },
    })
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserInput): Promise<User> {
    return this.db.user.create({
      data: {
        id: data.id,
        email: data.email,
        websiteUrl: data.websiteUrl,
        groomFirstName: data.groomFirstName,
        groomLastName: data.groomLastName,
        brideFirstName: data.brideFirstName,
        brideLastName: data.brideLastName,
      },
    })
  }

  /**
   * Update an existing user
   */
  async update(id: string, data: UpdateUserInput): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: {
        name: data.name,
        websiteUrl: data.websiteUrl,
        groomFirstName: data.groomFirstName,
        groomLastName: data.groomLastName,
        brideFirstName: data.brideFirstName,
        brideLastName: data.brideLastName,
      },
    })
  }

  /**
   * Check if a user exists
   */
  async exists(id: string): Promise<boolean> {
    const user = await this.db.user.findUnique({
      where: { id },
      select: { id: true },
    })
    return user !== null
  }
}
