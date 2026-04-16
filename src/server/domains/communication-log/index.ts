/**
 * Communication Log Domain - Barrel Export
 *
 * Exports all communication log domain components for use throughout the application.
 */

import { CommunicationLogRepository } from '~/server/domains/communication-log/communication-log.repository'
import { CommunicationLogService } from '~/server/domains/communication-log/communication-log.service'
import { db } from '~/server/infrastructure/database'

// Create singleton instances
const communicationLogRepository = new CommunicationLogRepository(db)
export const communicationLogService = new CommunicationLogService(communicationLogRepository, db)

// Export classes for testing/DI
export { CommunicationLogRepository } from '~/server/domains/communication-log/communication-log.repository'
// Export router
export { communicationLogRouter } from '~/server/domains/communication-log/communication-log.router'
export { CommunicationLogService } from '~/server/domains/communication-log/communication-log.service'
// Export types
export type {
  CommunicationLogEntry,
  HouseholdNote,
} from '~/server/domains/communication-log/communication-log.types'
// Export validators
export {
  type AddNoteSchemaInput,
  addNoteSchema,
  type DeleteNoteSchemaInput,
  deleteNoteSchema,
  type GetByHouseholdIdSchemaInput,
  getByHouseholdIdSchema,
} from '~/server/domains/communication-log/communication-log.validator'
