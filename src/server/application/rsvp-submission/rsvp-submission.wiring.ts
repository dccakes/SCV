/**
 * RSVP Submission Application Service - Wiring
 *
 * Single place that builds the service. The router imports this file directly
 * (not the barrel) to avoid circular imports, see src/server/api/root.ts.
 */

import { RsvpSubmissionService } from '~/server/application/rsvp-submission/rsvp-submission.service'
import { GuestRepository } from '~/server/domains/guest/guest.repository'
import { HouseholdRepository } from '~/server/domains/household/household.repository'
import { InvitationRepository } from '~/server/domains/invitation/invitation.repository'
import { QuestionRepository } from '~/server/domains/question/question.repository'
import { WebsiteRepository } from '~/server/domains/website/website.repository'
import { WeddingRepository } from '~/server/domains/wedding/wedding.repository'
import { db } from '~/server/infrastructure/database'
import { createUnitOfWork } from '~/server/infrastructure/database/unit-of-work'

const invitationRepo = new InvitationRepository(db)
const questionRepo = new QuestionRepository(db)
const guestRepo = new GuestRepository(db)
const householdRepo = new HouseholdRepository(db)
const weddingRepo = new WeddingRepository(db)

export const rsvpSubmissionService = new RsvpSubmissionService(
  invitationRepo,
  questionRepo,
  guestRepo,
  householdRepo,
  weddingRepo,
  new WebsiteRepository(db),
  createUnitOfWork(db, (tx) => ({
    invitation: new InvitationRepository(tx),
    question: new QuestionRepository(tx),
  }))
)
