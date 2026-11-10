import { Prisma, type PrismaClient } from '@prisma/client'
import { PrismaGuestExportReader } from '~/server/application/guest-export/guest-export.reader'

const findMany = (rows: unknown[] = []) => jest.fn().mockResolvedValue(rows)

const buildDb = (options: { website?: { id: string } | null } = {}) => {
  const db = {
    event: { findMany: findMany([{ id: 'e1', name: 'Reception', collectRsvp: true }]) },
    website: {
      findUnique: jest
        .fn()
        .mockResolvedValue(options.website === undefined ? { id: 'site-1' } : options.website),
    },
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
        { questionId: 'q3', guestId: 1, householdId: 'h1', response: '', updatedAt: new Date(2) },
      ]),
    },
    optionResponse: {
      findMany: findMany([
        {
          questionId: 'q1',
          guestId: 1,
          householdId: 'h1',
          updatedAt: new Date(3),
          option: { text: 'Fish', questionId: 'q1' },
        },
        {
          // Option from another question: must not land in q1's column
          questionId: 'q1',
          guestId: 1,
          householdId: 'h1',
          updatedAt: new Date(4),
          option: { text: 'Stray', questionId: 'q9' },
        },
      ]),
    },
    $transaction: jest.fn(),
  }
  db.$transaction.mockImplementation((run: (tx: typeof db) => unknown) => run(db))
  return db
}

const read = (db: ReturnType<typeof buildDb>) =>
  new PrismaGuestExportReader(db as unknown as PrismaClient).readWeddingGuestExport('w1')

describe('PrismaGuestExportReader', () => {
  it('reads everything in one repeatable read transaction', async () => {
    const db = buildDb()
    await read(db)

    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    })
  })

  it('scopes every query to the requested wedding and looks questions up by id', async () => {
    const db = buildDb()
    await read(db)

    for (const model of [db.event, db.household, db.guest, db.invitation]) {
      expect(model.findMany.mock.calls[0][0].where).toEqual({ weddingId: 'w1' })
    }
    expect(db.website.findUnique.mock.calls[0][0].where).toEqual({ weddingId: 'w1' })
    expect(db.question.findMany.mock.calls[0][0].where).toEqual({
      OR: [{ eventId: { in: ['e1'] } }, { websiteId: 'site-1' }],
    })
    expect(db.answer.findMany.mock.calls[0][0].where).toEqual({ questionId: { in: ['q1'] } })
    expect(db.optionResponse.findMany.mock.calls[0][0].where).toEqual({
      questionId: { in: ['q1'] },
    })
  })

  it('orders events and questions deterministically', async () => {
    const db = buildDb()
    await read(db)

    expect(db.event.findMany.mock.calls[0][0].orderBy).toEqual([
      { date: 'asc' },
      { createdAt: 'asc' },
      { id: 'asc' },
    ])
    expect(db.question.findMany.mock.calls[0][0].orderBy).toEqual([
      { createdAt: 'asc' },
      { id: 'asc' },
    ])
  })

  it('only asks for event questions when the wedding has no website', async () => {
    const db = buildDb({ website: null })
    await read(db)

    expect(db.question.findMany.mock.calls[0][0].where).toEqual({
      OR: [{ eventId: { in: ['e1'] } }],
    })
  })

  it('flattens tags, resolves option text, keeps blank answers and drops mismatched options', async () => {
    const result = await read(buildDb())

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
      { questionId: 'q3', guestId: 1, householdId: 'h1', response: '', updatedAt: new Date(2) },
      { questionId: 'q1', guestId: 1, householdId: 'h1', response: 'Fish', updatedAt: new Date(3) },
    ])
  })
})
