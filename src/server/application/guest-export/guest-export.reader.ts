/**
 * Guest Export Reader
 *
 * Reads a wedding's guest export in a fixed number of queries. It spans the
 * guest, household, invitation, event and question domains, so it lives with
 * the application service instead of any single domain repository.
 */

import type { PrismaClient } from '@prisma/client'
import type { GuestExportAnswer, GuestExportData } from '~/lib/guest-export/guest-export-csv'
import type { GuestExportReader } from '~/server/application/guest-export/guest-export.service'

export class PrismaGuestExportReader implements GuestExportReader {
  constructor(private db: PrismaClient) {}

  async readWeddingGuestExport(weddingId: string): Promise<GuestExportData> {
    // Event questions and general (website) questions that belong to this wedding
    const inWedding = {
      OR: [{ event: { weddingId } }, { website: { weddingId } }],
    }

    const [events, questions, households, guests, invitations, answers, optionResponses] =
      await Promise.all([
        this.db.event.findMany({
          where: { weddingId },
          orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
          select: { id: true, name: true },
        }),
        this.db.question.findMany({
          where: inWedding,
          orderBy: { createdAt: 'asc' },
          select: { id: true, text: true, eventId: true },
        }),
        this.db.household.findMany({
          where: { weddingId },
          select: {
            id: true,
            address1: true,
            address2: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
          },
        }),
        this.db.guest.findMany({
          where: { weddingId },
          select: {
            id: true,
            householdId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            ageGroup: true,
            isTagAlong: true,
            isPrimaryContact: true,
            guestTagAssignments: { select: { guestTag: { select: { name: true } } } },
          },
        }),
        this.db.invitation.findMany({
          where: { weddingId },
          select: { guestId: true, eventId: true, rsvp: true },
        }),
        this.db.answer.findMany({
          where: { question: inWedding },
          select: { questionId: true, guestId: true, householdId: true, response: true },
        }),
        this.db.optionResponse.findMany({
          where: { option: { question: inWedding } },
          select: {
            questionId: true,
            guestId: true,
            householdId: true,
            option: { select: { text: true } },
          },
        }),
      ])

    const allAnswers: GuestExportAnswer[] = [
      ...answers.filter((answer) => answer.response.trim().length > 0),
      ...optionResponses.map((response) => ({
        questionId: response.questionId,
        guestId: response.guestId,
        householdId: response.householdId,
        response: response.option.text,
      })),
    ]

    return {
      events,
      questions,
      households,
      guests: guests.map(({ guestTagAssignments, ...guest }) => ({
        ...guest,
        tags: guestTagAssignments.map((assignment) => assignment.guestTag.name),
      })),
      invitations,
      answers: allAnswers,
    }
  }
}
