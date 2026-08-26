/**
 * Messaging Domain - Types
 */

import type {
  ChatMessage as PrismaChatMessage,
  MessagingIdentity as PrismaMessagingIdentity,
  MessagingPairingToken as PrismaMessagingPairingToken,
  RateLimitBucket as PrismaRateLimitBucket,
  WhatsAppNumber as PrismaWhatsAppNumber,
} from '@prisma/client'

export type Channel = 'telegram' | 'whatsapp'
export type ChatRole = 'user' | 'assistant'

export type MessagingIdentity = PrismaMessagingIdentity
export type MessagingPairingToken = PrismaMessagingPairingToken
export type ChatMessage = PrismaChatMessage
export type RateLimitBucket = PrismaRateLimitBucket
export type WhatsAppNumber = PrismaWhatsAppNumber

export type SessionOptions = {
  sessionGapMs: number
  maxMessages: number
  maxChars: number
}

/** Minimal guest projection used to link an inbound WhatsApp sender. */
export type GuestPhoneMatch = {
  id: number
  householdId: string
  firstName: string
  lastName: string
}

/** Household + guest contact projection used to resolve broadcast recipients. */
export type HouseholdWithGuestPhones = {
  id: string
  guests: Array<{
    id: number
    firstName: string
    lastName: string
    phone: string | null
    isPrimaryContact: boolean
  }>
}

/** One WhatsApp conversation (identity) with display context for the couple. */
export type WhatsAppConversation = MessagingIdentity & {
  household: {
    id: string
    guests: Array<{ firstName: string; lastName: string; isPrimaryContact: boolean }>
  } | null
  messages: ChatMessage[]
}

/** Where a household update should be delivered. */
export type BroadcastRecipient = {
  householdId: string
  phone: string
  identityId: string | null
  guestId: number | null
  displayName: string
}

export type InboundWhatsAppResolution =
  | { status: 'ok'; weddingId: string; identity: MessagingIdentity }
  | { status: 'unknown_guest'; weddingId: string }
  | { status: 'unknown_number' }
