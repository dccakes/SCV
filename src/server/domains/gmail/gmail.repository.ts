/**
 * Gmail Domain - Repository
 *
 * Database operations for Connection (provider = "gmail"),
 * SyncState, and CommunicationMessage entities.
 */

import type { PrismaClient } from '@prisma/client'

const PROVIDER = 'gmail' as const

export class GmailRepository {
  constructor(private db: PrismaClient) {}

  // ─── Connection operations ─────────────────────────────────────────────────

  async findConnectionByUserId(userId: string) {
    return this.db.connection.findUnique({
      where: { userId_provider: { userId, provider: PROVIDER } },
    })
  }

  async upsertConnection(
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

  async deleteConnection(userId: string) {
    return this.db.connection.delete({
      where: { userId_provider: { userId, provider: PROVIDER } },
    })
  }

  // ─── Sync state operations ────────────────────────────────────────────────

  async getSyncState(connectionId: string) {
    return this.db.syncState.findUnique({ where: { connectionId } })
  }

  async upsertSyncState(
    connectionId: string,
    data: { cursor?: string | null; pageToken?: string | null; lastSyncedAt?: Date }
  ) {
    return this.db.syncState.upsert({
      where: { connectionId },
      create: { connectionId, ...data },
      update: data,
    })
  }

  // ─── Message operations ───────────────────────────────────────────────────

  async upsertMessage(data: {
    connectionId: string
    weddingId: string
    vendorId: string | null
    provider: string
    externalMessageId: string
    externalThreadId: string | null
    subject: string | null
    body: string
    snippet: string | null
    senderAddress: string
    senderName: string | null
    recipientAddresses: string[]
    direction: string
    sentAt: Date
    isDraft: boolean
  }) {
    return this.db.communicationMessage.upsert({
      where: {
        connectionId_externalMessageId: {
          connectionId: data.connectionId,
          externalMessageId: data.externalMessageId,
        },
      },
      create: data,
      update: {
        vendorId: data.vendorId,
        body: data.body,
        snippet: data.snippet,
        isDraft: data.isDraft,
      },
    })
  }

  async findMessagesByWedding(
    weddingId: string,
    options: { vendorId?: string; limit: number; offset: number }
  ) {
    const where = {
      weddingId,
      ...(options.vendorId ? { vendorId: options.vendorId } : {}),
    }

    const [messages, total] = await this.db.$transaction([
      this.db.communicationMessage.findMany({
        where,
        include: { vendor: { select: { name: true } } },
        orderBy: { sentAt: 'desc' },
        take: options.limit,
        skip: options.offset,
      }),
      this.db.communicationMessage.count({ where }),
    ])

    return {
      messages: messages.map((m) => ({
        ...m,
        vendorName: m.vendor?.name ?? null,
        vendor: undefined,
      })),
      total,
    }
  }

  async findMessagesByThread(externalThreadId: string) {
    const messages = await this.db.communicationMessage.findMany({
      where: { externalThreadId },
      include: { vendor: { select: { name: true } } },
      orderBy: { sentAt: 'asc' },
    })
    return messages.map((m) => ({
      ...m,
      vendorName: m.vendor?.name ?? null,
      vendor: undefined,
    }))
  }

  async deleteMessagesByConnectionId(connectionId: string) {
    return this.db.communicationMessage.deleteMany({ where: { connectionId } })
  }

  // ─── Vendor email lookup ──────────────────────────────────────────────────

  /**
   * Get all vendor contact emails for a wedding, mapped to vendorId.
   * Used to filter Gmail messages during sync.
   */
  async getVendorEmailMap(weddingId: string): Promise<Map<string, string>> {
    const vendors = await this.db.vendor.findMany({
      where: { weddingId, contactEmail: { not: null } },
      select: { id: true, contactEmail: true },
    })
    const map = new Map<string, string>()
    for (const v of vendors) {
      if (v.contactEmail) {
        map.set(v.contactEmail.toLowerCase(), v.id)
      }
    }
    return map
  }

  /**
   * Get a single vendor's contact email
   */
  async getVendorEmail(vendorId: string): Promise<string | null> {
    const vendor = await this.db.vendor.findUnique({
      where: { id: vendorId },
      select: { contactEmail: true },
    })
    return vendor?.contactEmail ?? null
  }

  /**
   * Get the weddingId for a vendor
   */
  async getVendorWeddingId(vendorId: string): Promise<string | null> {
    const vendor = await this.db.vendor.findUnique({
      where: { id: vendorId },
      select: { weddingId: true },
    })
    return vendor?.weddingId ?? null
  }
}
