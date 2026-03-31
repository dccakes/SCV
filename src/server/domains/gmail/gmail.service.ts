/**
 * Gmail Domain - Service
 *
 * Business logic for Gmail OAuth and Gmail API operations.
 * Uses googleapis for OAuth2 and Gmail API calls.
 */

import { TRPCError } from '@trpc/server'
import { google } from 'googleapis'
import crypto from 'node:crypto'

import { env } from '~/env'

import type { GmailRepository } from '~/server/domains/gmail/gmail.repository'
import type {
  GmailConnectionStatus,
  GmailMessage,
  GmailMessageHeader,
  GmailMessageList,
  GmailThread,
} from '~/server/domains/gmail/gmail.types'
import type { GmailCreateDraftInput } from '~/server/domains/gmail/gmail.validator'

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/userinfo.email',
]

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

  /**
   * Generate the Google OAuth URL for connecting Gmail.
   * State param contains the userId for CSRF-safe callback handling.
   */
  getAuthUrl(userId: string): string {
    const oauth2Client = this.createOAuth2Client()
    // Encrypt userId into state for CSRF protection
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

  /**
   * Exchange the OAuth code for tokens and store the connection.
   */
  async handleCallback(userId: string, code: string): Promise<void> {
    const oauth2Client = this.createOAuth2Client()
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Failed to obtain Gmail tokens. Please try connecting again.',
      })
    }

    // Fetch the connected email address
    oauth2Client.setCredentials(tokens)
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: userInfo } = await oauth2.userinfo.get()

    if (!userInfo.email) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Could not retrieve email from Google account',
      })
    }

    await this.gmailRepository.upsert(userId, {
      email: userInfo.email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      scope: tokens.scope ?? GMAIL_SCOPES.join(' '),
      expiresAt: new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000),
    })
  }

  /**
   * Disconnect Gmail — revoke token and remove from DB.
   */
  async disconnect(userId: string): Promise<void> {
    const connection = await this.gmailRepository.findByUserId(userId)
    if (!connection) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Gmail is not connected' })
    }

    // Best-effort revocation
    try {
      const oauth2Client = this.createOAuth2Client()
      oauth2Client.setCredentials({ access_token: connection.accessToken })
      await oauth2Client.revokeToken(connection.accessToken)
    } catch {
      // Revocation failure shouldn't block disconnect
    }

    await this.gmailRepository.delete(userId)
  }

  /**
   * Get connection status for the current user.
   */
  async getConnection(userId: string): Promise<GmailConnectionStatus> {
    const connection = await this.gmailRepository.findByUserId(userId)
    if (!connection) {
      return { connected: false, email: null }
    }
    return { connected: true, email: connection.email }
  }

  /**
   * List messages from the user's Gmail inbox.
   */
  async listMessages(
    userId: string,
    query?: string,
    maxResults = 20,
    pageToken?: string
  ): Promise<GmailMessageList> {
    const gmail = await this.getGmailClient(userId)

    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults,
      pageToken,
    })

    if (!listRes.data.messages?.length) {
      return { messages: [], nextPageToken: null, resultSizeEstimate: 0 }
    }

    // Fetch headers for each message (batch)
    const messages = await Promise.all(
      listRes.data.messages.map(async (msg) => {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'metadata',
          metadataHeaders: ['From', 'To', 'Subject', 'Date'],
        })
        return this.parseMessageHeader(detail.data)
      })
    )

    return {
      messages,
      nextPageToken: listRes.data.nextPageToken ?? null,
      resultSizeEstimate: listRes.data.resultSizeEstimate ?? 0,
    }
  }

  /**
   * Get a full thread with all messages.
   */
  async getThread(userId: string, threadId: string): Promise<GmailThread> {
    const gmail = await this.getGmailClient(userId)

    const threadRes = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'full',
    })

    const messages: GmailMessage[] = (threadRes.data.messages ?? []).map((msg) =>
      this.parseFullMessage(msg)
    )

    return { id: threadId, messages }
  }

  /**
   * Create a draft reply in the user's Gmail.
   */
  async createDraft(userId: string, input: GmailCreateDraftInput): Promise<string> {
    const gmail = await this.getGmailClient(userId)

    const connection = await this.gmailRepository.findByUserId(userId)
    const fromEmail = connection?.email ?? 'me'

    // Build RFC 2822 message
    const messageParts = [
      `From: ${fromEmail}`,
      `To: ${input.to}`,
      `Subject: ${input.subject}`,
      ...(input.inReplyTo ? [`In-Reply-To: ${input.inReplyTo}`, `References: ${input.inReplyTo}`] : []),
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

    return draft.data.id!
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  /**
   * Get an authenticated Gmail client, refreshing tokens if needed.
   */
  private async getGmailClient(userId: string) {
    const connection = await this.gmailRepository.findByUserId(userId)
    if (!connection) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Gmail is not connected. Please connect Gmail in Settings.',
      })
    }

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

  private getHeader(
    headers: { name?: string | null; value?: string | null }[] | undefined,
    name: string
  ): string {
    return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ''
  }

  private parseMessageHeader(msg: {
    id?: string | null
    threadId?: string | null
    snippet?: string | null
    labelIds?: string[] | null
    payload?: { headers?: { name?: string | null; value?: string | null }[] | null } | null
  }): GmailMessageHeader {
    const headers = msg.payload?.headers ?? []
    return {
      id: msg.id ?? '',
      threadId: msg.threadId ?? '',
      from: this.getHeader(headers, 'From'),
      to: this.getHeader(headers, 'To'),
      subject: this.getHeader(headers, 'Subject'),
      snippet: msg.snippet ?? '',
      date: this.getHeader(headers, 'Date'),
      labelIds: msg.labelIds ?? [],
    }
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
    const header = this.parseMessageHeader(msg)

    // Extract body — try plain text first, then HTML
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

    return { ...header, body }
  }
}
