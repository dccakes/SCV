/**
 * Invitation Domain - Barrel Export
 *
 * Exports all invitation domain components for use throughout the application.
 */

import { InvitationRepository } from '~/server/domains/invitation/invitation.repository'
import { InvitationService } from '~/server/domains/invitation/invitation.service'
import { db } from '~/server/infrastructure/database'

// Create singleton instances
const invitationRepository = new InvitationRepository(db)
export const invitationService = new InvitationService(invitationRepository)

// Export types
export type {
  CreateInvitationInput,
  Invitation,
  RsvpStats,
  UpdateInvitationInput,
} from '~/server/domains/invitation/invitation.types'

// Export validators
export {
  createInvitationSchema,
  type CreateInvitationSchemaInput,
  invitationIdSchema,
  type InvitationIdSchemaInput,
  updateInvitationSchema,
  type UpdateInvitationSchemaInput,
} from '~/server/domains/invitation/invitation.validator'

// Export classes for testing/DI
export { InvitationRepository } from '~/server/domains/invitation/invitation.repository'
export { InvitationService } from '~/server/domains/invitation/invitation.service'

// Export router
export { invitationRouter } from '~/server/domains/invitation/invitation.router'
