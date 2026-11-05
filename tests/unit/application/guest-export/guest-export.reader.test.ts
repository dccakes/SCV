import type { PrismaClient } from '@prisma/client'
import { PrismaGuestExportReader } from '~/server/application/guest-export/guest-export.reader'

const findMany = (rows: unknown[] = []) => jest.fn().mockResolvedValue(rows)

const buildDb = () => ({
  event: { findMany: findMany([{ id: 'e1', name: 'Reception' }]) },
  question: { findMany: findMany([{ id: 'q1', text: 'Meal', eventId: 'e1' }]) },
  household: { findMany: findMany() },
  guest: {
    findMany: findMany([
      {
        id: 1,
        householdId: 'h1',
        firstName: 'Ana',
        lastName: 'Ruiz',
        email: null,
        phone: null,
        ageGroup: 'ADULT',
        isTagAlong: false,
        isPrimaryContact: true,
        guestTagAssignments: [{ guestTag: { name: 'Family' } }],
      },
    ]),
  },
  invitation: { findMany: findMany() },
  answer: {
    findMany: findMany([
      {
        questionId: 'q2',
        guestId: 1,
        householdId: 'h1',
        response: 'Peanuts',
        updatedAt: new Date(1),
      },
      { questionId: 'q3', guestId: 1, householdId: 'h1', response: '   ', updatedAt: new Date(2) },
    ]),
  },
  optionResponse: {
    findMany: findMany([
      {
        questionId: 'q1',
        guestId: 1,
        householdId: 'h1',
        updatedAt: new Date(3),
        option: { text: 'Fish' },
      },
    ]),
  },
})

describe('PrismaGuestExportReader', () => {
  it('scopes every query to the requested wedding', async () => {
    const db = buildDb()
    await new PrismaGuestExportReader(db as unknown as PrismaClient).readWeddingGuestExport('w1')

    const inWedding = { OR: [{ event: { weddingId: 'w1' } }, { website: { weddingId: 'w1' } }] }
    for (const model of [db.event, db.household, db.guest, db.invitation]) {
      expect(model.findMany.mock.calls[0][0].where).toEqual({ weddingId: 'w1' })
    }
    expect(db.question.findMany.mock.calls[0][0].where).toEqual(inWedding)
    expect(db.answer.findMany.mock.calls[0][0].where).toEqual({ question: inWedding })
    expect(db.optionResponse.findMany.mock.calls[0][0].where).toEqual({
      option: { question: inWedding },
    })
  })

  it('flattens tags, resolves option text and drops blank answers', async () => {
    const result = await new PrismaGuestExportReader(
      buildDb() as unknown as PrismaClient
    ).readWeddingGuestExport('w1')

    expect(result.guests[0]).toEqual(expect.objectContaining({ id: 1, tags: ['Family'] }))
    expect(result.guests[0]).not.toHaveProperty('guestTagAssignments')
    expect(result.answers).toEqual([
      {
        questionId: 'q2',
        guestId: 1,
        householdId: 'h1',
        response: 'Peanuts',
        updatedAt: new Date(1),
      },
      { questionId: 'q1', guestId: 1, householdId: 'h1', response: 'Fish', updatedAt: new Date(3) },
    ])
  })
})
