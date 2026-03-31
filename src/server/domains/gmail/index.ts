/**
 * Gmail Domain - Barrel Export
 *
 * Exports all Gmail domain components for use throughout the application.
 */

import { GmailRepository } from '~/server/domains/gmail/gmail.repository'
import { GmailService } from '~/server/domains/gmail/gmail.service'
import { db } from '~/server/infrastructure/database'

// Create singleton instances
const gmailRepository = new GmailRepository(db)
export const gmailService = new GmailService(gmailRepository)

// Export classes for testing/DI
export { GmailRepository } from '~/server/domains/gmail/gmail.repository'
export { GmailService } from '~/server/domains/gmail/gmail.service'

// Export types
export type {
  GmailConnection,
  GmailConnectionStatus,
  GmailMessage,
  GmailMessageHeader,
  GmailMessageList,
  GmailThread,
} from '~/server/domains/gmail/gmail.types'

// Export validators
export {
  type GmailCallbackInput,
  type GmailCreateDraftInput,
  type GmailGetThreadInput,
  type GmailListMessagesInput,
  gmailCallbackSchema,
  gmailCreateDraftSchema,
  gmailGetThreadSchema,
  gmailListMessagesSchema,
} from '~/server/domains/gmail/gmail.validator'
