/**
 * Guest Export Reader
 *
 * Reads a wedding's guest export. It spans the guest, household, invitation,
 * event and question domains, so it lives with the application service
 * instead of any single domain repository.
 */

import { Prisma, type PrismaClient } from '@prisma/client'
import type { GuestExportAnswer, GuestExportData } from '~/lib/guest-export/guest-export-csv'
import type { GuestExportReader } from '~/server/application/guest-export/guest-export.service'

type ReadClient = Prisma.TransactionClient

export class PrismaGuestExportReader implements GuestExportReader {
  constructor(private db: PrismaClient) {}

  /**
   * All reads share one REPEATABLE READ snapshot, so an RSVP saved while the
   * export runs is seen either completely or not at all (never a new RSVP
   * status next to the old answers).
   */
  readWeddingGuestExport(weddingId: string): Promise<GuestExportData> {
    return this.db.$transaction((tx) => this.read(tx, weddingId), {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    })
  }

  private async read(tx: ReadClient, weddingId: string): Promise<GuestExportData> {
    const [events, website, households, guests, invitations] = await Promise.all([
      tx.event.findMany({
        where: { weddingId },
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
        select: { id: true, name: true, collectRsvp: true },
      }),
      tx.website.findUnique({ where: { weddingId }, select: { id: true } }),
      tx.household.findMany({
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
      tx.guest.findMany({
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
      tx.invitation.findMany({
        where: { weddingId },
        select: { guestId: true, eventId: true, rsvp: true },
      }),
    ])

    // Look questions and answers up by id so Postgres can use the eventId,
    // websiteId and questionId indexes directly, instead of relation filters
    // whose cost grows with every wedding in the database
    const questionScope: Prisma.QuestionWhereInput[] = [
      { eventId: { in: events.map((event) => event.id) } },
      ...(website ? [{ websiteId: website.id }] : []),
    ]
    const questions = await tx.question.findMany({
      where: { OR: questionScope },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: { id: true, text: true, eventId: true },
    })

    const questionIds = questions.map((question) => question.id)
    const [answers, optionResponses] = await Promise.all([
      tx.answer.findMany({
        where: { questionId: { in: questionIds } },
        select: {
          questionId: true,
          guestId: true,
          householdId: true,
          response: true,
          updatedAt: true,
        },
      }),
      tx.optionResponse.findMany({
        where: { questionId: { in: questionIds } },
        select: {
          questionId: true,
          guestId: true,
          householdId: true,
          updatedAt: true,
          option: { select: { text: true, questionId: true } },
        },
      }),
    ])

    // Blank answers are kept: a newer blank answer must still replace an older
    // filled one. The CSV builder decides what an empty response shows.
    const allAnswers: GuestExportAnswer[] = [
      ...answers,
      ...optionResponses
        // Ignore a response whose option belongs to a different question
        .filter((response) => response.option.questionId === response.questionId)
        .map((response) => ({
          questionId: response.questionId,
          guestId: response.guestId,
          householdId: response.householdId,
          response: response.option.text,
          updatedAt: response.updatedAt,
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
