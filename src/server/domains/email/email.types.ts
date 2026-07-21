/**
 * Email Domain - Types
 */

import type { InboundAttachment } from '~/lib/email/resend-webhook'
import type { EmailTriageResult } from '~/lib/email/triage'

export type EmailDirection = 'inbound' | 'outbound'

export interface WeddingEmailInbox {
  id: string
  weddingId: string
  localPart: string
  address: string
  provisionedAt: Date
  disabledAt: Date | null
}

export interface EmailThread {
  id: string
  weddingId: string
  subject: string
  counterpartyEmail: string
  counterpartyName: string | null
  providerConversationId: string | null
  category: string
  status: string
  vendorId: string | null
  lastMessageAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface EmailMessage {
  id: string
  threadId: string
  weddingId: string
  direction: EmailDirection
  fromAddress: string
  fromName: string | null
  toAddresses: string[]
  ccAddresses: string[]
  subject: string
  text: string | null
  html: string | null
  providerId: string | null
  messageIdHeader: string | null
  inReplyTo: string | null
  references: string[]
  attachments: InboundAttachment[]
  createdAt: Date
}

export interface EmailMessageTriage {
  category: string
  intent: string
  summary: string
  priority: string
  suggestedActions: { type: string; reason: string; to?: string }[]
  confidence: number
  status: string
}

export interface EmailMessageWithTriage extends EmailMessage {
  triage: EmailMessageTriage | null
}

export interface RecordInboundInput {
  weddingId: string
  inboxId: string
  conversationId?: string
  fromAddress: string
  fromName?: string
  toAddresses: string[]
  ccAddresses: string[]
  subject: string
  text?: string
  html?: string
  providerId: string
  messageIdHeader?: string
  inReplyTo?: string
  references: string[]
  attachments: InboundAttachment[]
}

export interface RecordOutboundInput {
  weddingId: string
  threadId: string
  fromAddress: string
  fromName?: string
  toAddresses: string[]
  ccAddresses?: string[]
  subject: string
  text?: string
  html?: string
  providerId?: string
  inReplyTo?: string
  references?: string[]
  attachments?: InboundAttachment[]
}

export interface PersistTriageInput {
  messageId: string
  weddingId: string
  result: EmailTriageResult
}
