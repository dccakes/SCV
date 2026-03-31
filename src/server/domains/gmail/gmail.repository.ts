/**
 * Gmail Domain - Repository
 *
 * Database operations for the Connection entity (provider = "gmail").
 */

import type { PrismaClient } from '@prisma/client'

const PROVIDER = 'gmail' as const

export class GmailRepository {
  constructor(private db: PrismaClient) {}

  async findByUserId(userId: string) {
    return this.db.connection.findUnique({
      where: { userId_provider: { userId, provider: PROVIDER } },
    })
  }

  async upsert(
    userId: string,
    data: {
      email: string
      accessToken: string
      refreshToken: string
      scope: string
      expiresAt: Date
    }
  ) {
    return this.db.connection.upsert({
      where: { userId_provider: { userId, provider: PROVIDER } },
      create: { userId, provider: PROVIDER, ...data },
      update: data,
    })
  }

  async updateTokens(id: string, accessToken: string, expiresAt: Date) {
    return this.db.connection.update({
      where: { id },
      data: { accessToken, expiresAt },
    })
  }

  async delete(userId: string) {
    return this.db.connection.delete({
      where: { userId_provider: { userId, provider: PROVIDER } },
    })
  }
}
