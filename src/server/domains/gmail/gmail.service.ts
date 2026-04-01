/**
 * Gmail Domain - Service
 *
 * Business logic for Gmail OAuth, sync, and local message storage.
 * Syncs vendor-related emails from Gmail into CommunicationMessage table.
 */

import { TRPCError } from '@trpc/server'
import { google } from 'googleapis'
import crypto from 'node:crypto'

import { env } from '~/env'

import type { GmailRepository } from '~/server/domains/gmail/gmail.repository'
import {
  DIRECTION_INBOUND,
  DIRECTION_OUTBOUND,
  PROVIDER_GMAIL,
} from '~/server/domains/gmail/gmail.types'
import type {
  GmailConnectionStatus,
  GmailMessage,
  StoredMessage,
  StoredMessageList,
  StoredThread,
  SyncResult,
} from '~/server/domains/gmail/gmail.types'
import type { GmailCreateDraftInput } from '~/server/domains/gmail/gmail.validator'

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/userinfo.email',
]

/** Max messages to fetch per sync pass */
const SYNC_BATCH_SIZE = 50

export class GmailService {
  constructor(private gmailRepository: GmailRepository) {}

  private createOAuth2Client() {
    const clientId = env.GOOGLE_CLIENT_ID
    const clientSecret = env.GOOGLE_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Google OAuth is not configured',
      })
    }
    const baseUrl = env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${env.PORT ?? '3000'}`
    return new google.auth.OAuth2(clientId, clientSecret, `${baseUrl}/api/gmail/callback`)
  }

  // ─── OAuth ─────────────────────────────────────────────────────────────────

  // TODO: Sign OAuth state with HMAC (using BETTER_AUTH_SECRET) for defense-in-depth CSRF protection
  getAuthUrl(userId: string): string {
    const oauth2Client = this.createOAuth2Client()
    const state = Buffer.from(JSON.stringify({ userId, nonce: crypto.randomUUID() })).toString(
      'base64url'
    )
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: GMAIL_SCOPES,
      state,
    })
  }

  async handleCallback(userId: string, code: string): Promise<void> {
    const oauth2Client = this.createOAuth2Client()
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Failed to obtain Gmail tokens. Please try connecting again.',
      })
    }

    oauth2Client.setCredentials(tokens)
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: userInfo } = await oauth2.userinfo.get()

    if (!userInfo.email) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Could not retrieve email from Google account',
      })
    }

    await this.gmailRepository.upsertConnection(userId, {
      email: userInfo.email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      scope: tokens.scope ?? GMAIL_SCOPES.join(' '),
      expiresAt: new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000),
    })

    // Trigger initial sync in background (fire and forget)
    this.syncAllVendorEmails(userId).catch((err) => {
      console.error('Initial Gmail sync failed for user:', userId, err)
    })
  }

  async disconnect(userId: string): Promise<void> {
    const connection = await this.gmailRepository.findConnectionByUserId(userId)
    if (!connection) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Gmail is not connected' })
    }

    try {
      const oauth2Client = this.createOAuth2Client()
      oauth2Client.setCredentials({ access_token: connection.accessToken })
      await oauth2Client.revokeToken(connection.accessToken)
    } catch {
      // Revocation failure shouldn't block disconnect
    }

    await this.gmailRepository.deleteConnection(userId)
  }

  async getConnection(userId: string): Promise<GmailConnectionStatus> {
    const connection = await this.gmailRepository.findConnectionByUserId(userId)
    if (!connection) {
      return { connected: false, email: null }
    }
    return { connected: true, email: connection.email }
  }

  // ─── Sync logic ────────────────────────────────────────────────────────────

  /**
   * Sync all vendor emails for a user's wedding.
   * Fetches Gmail messages that involve any vendor contact email,
   * then stores them locally as CommunicationMessages.
   */
  async syncAllVendorEmails(userId: string): Promise<SyncResult> {
    const connection = await this.getRequiredConnection(userId)
    const weddingId = await this.getWeddingIdForUser(userId)
    const vendorEmailMap = await this.gmailRepository.getVendorEmailMap(weddingId)

    if (vendorEmailMap.size === 0) {
      return { synced: 0, skipped: 0 }
    }

    const gmail = await this.getGmailClientForConnection(connection)
    const vendorEmails = Array.from(vendorEmailMap.keys())

    // Build Gmail search query: messages from/to any vendor email
    const gmailQuery = vendorEmails.map((e) => `from:${e} OR to:${e}`).join(' OR ')

    return this.syncMessagesForQuery(
      gmail,
      connection.id,
      connection.email,
      weddingId,
      vendorEmailMap,
      gmailQuery
    )
  }

  /**
   * Sync emails for a single vendor (by vendor contact email).
   * Called when a vendor is created or their contact email changes.
   */
  async syncForVendor(userId: string, vendorId: string): Promise<SyncResult> {
    const connection = await this.gmailRepository.findConnectionByUserId(userId)
    if (!connection) {
      return { synced: 0, skipped: 0 }
    }

    const vendor = await this.gmailRepository.getVendorForSync(vendorId)
    if (!vendor?.contactEmail || !vendor.weddingId) {
      return { synced: 0, skipped: 0 }
    }

    // Verify the vendor belongs to the calling user's wedding
    const userWeddingId = await this.getWeddingIdForUser(userId)
    if (vendor.weddingId !== userWeddingId) {
      return { synced: 0, skipped: 0 }
    }

    const vendorEmail = vendor.contactEmail
    const vendorWeddingId = vendor.weddingId

    const gmail = await this.getGmailClientForConnection(connection)
    const vendorEmailMap = new Map([[vendorEmail.toLowerCase(), vendorId]])
    const gmailQuery = `from:${vendorEmail} OR to:${vendorEmail}`

    return this.syncMessagesForQuery(
      gmail,
      connection.id,
      connection.email,
      vendorWeddingId,
      vendorEmailMap,
      gmailQuery
    )
  }

  private async syncMessagesForQuery(
    gmail: ReturnType<typeof google.gmail>,
    connectionId: string,
    connectedEmail: string,
    weddingId: string,
    vendorEmailMap: Map<string, string>,
    gmailQuery: string
  ): Promise<SyncResult> {
    const MAX_SYNC_PAGES = 20 // Safety limit: max 20 pages × 50 = 1000 messages per sync
    let synced = 0
    let skipped = 0
    let pageToken: string | undefined
    let pagesProcessed = 0

    do {
      pagesProcessed++

      const listRes = await gmail.users.messages.list({
        userId: 'me',
        q: gmailQuery,
        maxResults: SYNC_BATCH_SIZE,
        pageToken,
      })

      if (!listRes.data.messages?.length) break

      // Process messages in parallel batches of 10
      const batchSize = 10
      for (let i = 0; i < listRes.data.messages.length; i += batchSize) {
        const batch = listRes.data.messages.slice(i, i + batchSize)
        const results = await Promise.allSettled(
          batch.map(async (msg) => {
            if (!msg.id) return null

            const detail = await gmail.users.messages.get({
              userId: 'me',
              id: msg.id,
              format: 'full',
            })

            const parsed = this.parseFullMessage(detail.data)
            const vendorId = this.matchVendorEmail(parsed, vendorEmailMap)

            if (!vendorId) {
              return null
            }

            const direction = this.isOutbound(parsed.from, connectedEmail)
              ? DIRECTION_OUTBOUND
              : DIRECTION_INBOUND

            await this.gmailRepository.upsertMessage({
              connectionId,
              weddingId,
              vendorId,
              provider: PROVIDER_GMAIL,
              externalMessageId: parsed.id,
              externalThreadId: parsed.threadId,
              subject: parsed.subject || null,
              body: parsed.body,
              snippet: parsed.snippet || null,
              senderAddress: this.extractEmail(parsed.from),
              senderName: this.extractName(parsed.from),
              recipientAddresses: parsed.to.split(',').map((r) => this.extractEmail(r.trim())),
              direction,
              sentAt: new Date(parsed.date),
              isDraft: false,
            })
            return 'synced' as const
          })
        )
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value === 'synced') synced++
          else skipped++
        }
      }

      pageToken = listRes.data.nextPageToken ?? undefined
    } while (pageToken && pagesProcessed < MAX_SYNC_PAGES)

    // Update sync state
    await this.gmailRepository.upsertSyncState(connectionId, {
      lastSyncedAt: new Date(),
    })

    return { synced, skipped }
  }

  // ─── Local message queries (from DB, not Gmail API) ────────────────────────

  async listMessages(
    userId: string,
    options: { vendorId?: string; limit: number; offset: number }
  ): Promise<StoredMessageList> {
    const weddingId = await this.getWeddingIdForUser(userId)
    return this.gmailRepository.findMessagesByWedding(weddingId, options)
  }

  async getThread(userId: string, threadId: string): Promise<StoredThread> {
    const weddingId = await this.getWeddingIdForUser(userId)
    const messages = await this.gmailRepository.findMessagesByThread(threadId, weddingId)
    if (messages.length === 0) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Thread not found' })
    }
    return {
      threadId,
      messages: messages as StoredMessage[],
      vendorName: messages[0]?.vendorName ?? null,
    }
  }

  // ─── Draft creation (still calls Gmail API directly) ──────────────────────

  async createDraft(userId: string, input: GmailCreateDraftInput): Promise<string> {
    const connection = await this.getRequiredConnection(userId)
    const gmail = await this.getGmailClientForConnection(connection)
    const fromEmail = connection.email

    // Sanitize header values to prevent CRLF injection
    const sanitizeHeader = (v: string) => v.replace(/[\r\n]/g, '')

    const messageParts = [
      `From: ${sanitizeHeader(fromEmail)}`,
      `To: ${sanitizeHeader(input.to)}`,
      `Subject: ${sanitizeHeader(input.subject)}`,
      ...(input.inReplyTo
        ? [`In-Reply-To: ${sanitizeHeader(input.inReplyTo)}`, `References: ${sanitizeHeader(input.inReplyTo)}`]
        : []),
      'Content-Type: text/plain; charset=utf-8',
      '',
      input.body,
    ]
    const rawMessage = Buffer.from(messageParts.join('\r\n')).toString('base64url')

    const draft = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: rawMessage,
          threadId: input.threadId,
        },
      },
    })

    if (!draft.data.id) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create draft' })
    }
    return draft.data.id
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async getRequiredConnection(userId: string) {
    const connection = await this.gmailRepository.findConnectionByUserId(userId)
    if (!connection) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Gmail is not connected. Please connect Gmail in Settings.',
      })
    }
    return connection
  }

  private async getWeddingIdForUser(userId: string): Promise<string> {
    const weddingId = await this.gmailRepository.findWeddingIdByUserId(userId)
    if (!weddingId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'No wedding found for user' })
    }
    return weddingId
  }

  private async getGmailClientForConnection(connection: { accessToken: string; refreshToken: string; expiresAt: Date; id: string }) {
    const oauth2Client = this.createOAuth2Client()
    oauth2Client.setCredentials({
      access_token: connection.accessToken,
      refresh_token: connection.refreshToken,
      expiry_date: connection.expiresAt.getTime(),
    })

    // Auto-refresh if expired
    if (connection.expiresAt.getTime() <= Date.now() + 60_000) {
      const { credentials } = await oauth2Client.refreshAccessToken()
      if (credentials.access_token) {
        await this.gmailRepository.updateTokens(
          connection.id,
          credentials.access_token,
          new Date(credentials.expiry_date ?? Date.now() + 3600 * 1000)
        )
        oauth2Client.setCredentials(credentials)
      }
    }

    return google.gmail({ version: 'v1', auth: oauth2Client })
  }

  /**
   * Match a parsed message's from/to against vendor emails.
   * Returns the vendorId if any address matches.
   */
  private matchVendorEmail(
    msg: GmailMessage,
    vendorEmailMap: Map<string, string>
  ): string | null {
    const allAddresses = [msg.from, ...msg.to.split(',')].map((a) =>
      this.extractEmail(a.trim()).toLowerCase()
    )
    for (const addr of allAddresses) {
      const vendorId = vendorEmailMap.get(addr)
      if (vendorId) return vendorId
    }
    return null
  }

  private isOutbound(from: string, connectedEmail: string): boolean {
    return this.extractEmail(from).toLowerCase() === connectedEmail.toLowerCase()
  }

  /** Extract email from "Name <email@example.com>" format */
  private extractEmail(addressStr: string): string {
    const match = addressStr.match(/<([^>]+)>/)
    return match ? match[1]! : addressStr.trim()
  }

  /** Extract display name from "Name <email@example.com>" format */
  private extractName(addressStr: string): string | null {
    const match = addressStr.match(/^(.+?)\s*</)
    return match ? match[1]!.replace(/^["']|["']$/g, '').trim() : null
  }

  // ─── Gmail message parsing ─────────────────────────────────────────────────

  private getHeader(
    headers: { name?: string | null; value?: string | null }[] | undefined,
    name: string
  ): string {
    return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ''
  }

  private parseFullMessage(msg: {
    id?: string | null
    threadId?: string | null
    snippet?: string | null
    labelIds?: string[] | null
    payload?: {
      headers?: { name?: string | null; value?: string | null }[] | null
      body?: { data?: string | null } | null
      parts?: { mimeType?: string | null; body?: { data?: string | null } | null }[] | null
    } | null
  }): GmailMessage {
    const headers = msg.payload?.headers ?? []

    let body = ''
    const payload = msg.payload
    if (payload?.body?.data) {
      body = Buffer.from(payload.body.data, 'base64url').toString('utf-8')
    } else if (payload?.parts) {
      const textPart = payload.parts.find((p) => p.mimeType === 'text/plain')
      const htmlPart = payload.parts.find((p) => p.mimeType === 'text/html')
      const part = textPart ?? htmlPart
      if (part?.body?.data) {
        body = Buffer.from(part.body.data, 'base64url').toString('utf-8')
      }
    }

    return {
      id: msg.id ?? '',
      threadId: msg.threadId ?? '',
      from: this.getHeader(headers, 'From'),
      to: this.getHeader(headers, 'To'),
      subject: this.getHeader(headers, 'Subject'),
      snippet: msg.snippet ?? '',
      date: this.getHeader(headers, 'Date'),
      labelIds: msg.labelIds ?? [],
      body,
    }
  }
}
