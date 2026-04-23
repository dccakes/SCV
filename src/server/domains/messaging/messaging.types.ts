/**
 * Messaging Domain - Types
 */

import type {
  ChatMessage as PrismaChatMessage,
  MessagingIdentity as PrismaMessagingIdentity,
  MessagingPairingToken as PrismaMessagingPairingToken,
  RateLimitBucket as PrismaRateLimitBucket,
} from '@prisma/client'

export type Channel = 'telegram'
export type ChatRole = 'user' | 'assistant'

export type MessagingIdentity = PrismaMessagingIdentity
export type MessagingPairingToken = PrismaMessagingPairingToken
export type ChatMessage = PrismaChatMessage
export type RateLimitBucket = PrismaRateLimitBucket

export type SessionOptions = {
  sessionGapMs: number
  maxMessages: number
  maxChars: number
}
