/**
 * Gmail Domain - Types
 *
 * TypeScript types for Gmail integration.
 */

export const PROVIDER_GMAIL = 'gmail' as const
export const DIRECTION_INBOUND = 'inbound' as const
export const DIRECTION_OUTBOUND = 'outbound' as const
export type MessageDirection = typeof DIRECTION_INBOUND | typeof DIRECTION_OUTBOUND
export type ConnectionProvider = typeof PROVIDER_GMAIL

export type GmailConnection = {
  id: string
  userId: string
  provider: 'gmail'
  email: string
  scope: string
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

export type GmailConnectionStatus = {
  connected: boolean
  email: string | null
}

// ─── Gmail API types (used during sync) ────────────────────────────────────

export type GmailMessageHeader = {
  id: string
  threadId: string
  from: string
  to: string
  subject: string
  snippet: string
  date: string
  labelIds: string[]
}

export type GmailMessage = GmailMessageHeader & {
  body: string
}

export type GmailThread = {
  id: string
  messages: GmailMessage[]
}

// ─── Local stored message types ────────────────────────────────────────────

export type StoredMessage = {
  id: string
  weddingId: string
  connectionId: string
  vendorId: string | null
  vendorName: string | null
  provider: string
  externalMessageId: string | null
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
  createdAt: Date
}

export type StoredMessageList = {
  messages: StoredMessage[]
  total: number
}

export type StoredThread = {
  threadId: string
  messages: StoredMessage[]
  vendorName: string | null
}

export type SyncResult = {
  synced: number
  skipped: number
}
