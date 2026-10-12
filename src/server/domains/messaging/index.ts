/**
 * Messaging Domain - Barrel Export
 */

import { MessagingRepository } from '~/server/domains/messaging/messaging.repository'
import { MessagingService } from '~/server/domains/messaging/messaging.service'
import { db } from '~/server/infrastructure/database'

const messagingRepository = new MessagingRepository(db)
export const messagingService = new MessagingService(messagingRepository)

export { MessagingRepository } from '~/server/domains/messaging/messaging.repository'
export { MessagingService } from '~/server/domains/messaging/messaging.service'
export type {
  BroadcastRecipient,
  Channel,
  ChatMessage,
  ChatRole,
  GuestPhoneMatch,
  HouseholdWithGuestPhones,
  InboundWhatsAppResolution,
  MessagingIdentity,
  MessagingPairingToken,
  RateLimitBucket,
  SessionOptions,
  WhatsAppConversation,
  WhatsAppNumber,
} from '~/server/domains/messaging/messaging.types'
export {
  type CreatePairingTokenInput,
  createPairingTokenSchema,
  type RevokeIdentityInput,
  revokeIdentitySchema,
} from '~/server/domains/messaging/messaging.validator'
