/**
 * Email Domain - Barrel Export
 */

import { EmailRepository } from '~/server/domains/email/email.repository'
import { EmailService } from '~/server/domains/email/email.service'
import { db } from '~/server/infrastructure/database'

const emailRepository = new EmailRepository(db)
export const emailService = new EmailService(emailRepository)

export { EmailRepository } from '~/server/domains/email/email.repository'
export { deriveReplySubject, EmailService } from '~/server/domains/email/email.service'
export type {
  EmailDirection,
  EmailMessage,
  EmailThread,
  RecordInboundInput,
  RecordOutboundInput,
  WeddingEmailInbox,
} from '~/server/domains/email/email.types'
export {
  type GetThreadInput,
  getThreadSchema,
  type SendReplyInput,
  sendReplySchema,
} from '~/server/domains/email/email.validator'
