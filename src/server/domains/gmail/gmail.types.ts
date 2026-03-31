/**
 * Gmail Domain - Types
 *
 * TypeScript types for Gmail integration.
 */

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

export type GmailMessageList = {
  messages: GmailMessageHeader[]
  nextPageToken: string | null
  resultSizeEstimate: number
}
