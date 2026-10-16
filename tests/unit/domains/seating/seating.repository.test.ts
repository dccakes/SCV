import { Prisma, type PrismaClient } from '@prisma/client'

import {
  SeatAlreadyTakenError,
  SeatingTableNotFoundError,
} from '~/server/domains/seating/seating.errors'
import { SeatingRepository } from '~/server/domains/seating/seating.repository'

const SEATABLE = { eventId: 'event-1', rsvp: { notIn: ['Declined', 'Not Invited'] } }

const buildDb = () => {
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([{ name: 'T1', capacity: 6 }]),
    seatAssignment: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      findMany: jest.fn().mockResolvedValue([{ guestId: 1 }]),
    },
    seatingTable: { update: jest.fn().mockResolvedValue({}) },
  }
  const db = {
    seatingTable: { findMany: jest.fn(), findUnique: jest.fn() },
    seatAssignment: { findMany: jest.fn() },
    $transaction: jest.fn((work: (client: typeof tx) => Promise<unknown>) => work(tx)),
  }
  return { db, tx, repo: new SeatingRepository(db as unknown as PrismaClient) }
}

describe('SeatingRepository', () => {
  it('only returns seats for guests who are still seatable for the event', async () => {
    const { db, repo } = buildDb()
    db.seatingTable.findMany.mockResolvedValue([])

    await repo.findTablesByEventId('event-1')

    expect(db.seatingTable.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          seatAssignments: expect.objectContaining({
            where: { guest: { invitations: { some: SEATABLE } } },
          }),
        },
      })
    )
  })

  it('looks a table up with a single query', async () => {
    const { db, repo } = buildDb()
    db.seatingTable.findUnique.mockResolvedValue({ id: 't1', eventId: 'event-1' })

    expect(await repo.findTableById('t1')).toEqual({ id: 't1', eventId: 'event-1' })
    expect(db.seatingTable.findUnique).toHaveBeenCalledWith({ where: { id: 't1' } })
    expect(db.seatAssignment.findMany).not.toHaveBeenCalled()
  })

  describe('withLockedTable', () => {
    it('locks the table row and purges stale seats before running the work', async () => {
      const { tx, repo } = buildDb()
      const order: string[] = []
      tx.$queryRaw.mockImplementation(async () => {
        order.push('lock')
        return [{ name: 'T1', capacity: 6 }]
      })
      tx.seatAssignment.deleteMany.mockImplementation(async () => order.push('purge'))

      await repo.withLockedTable({ id: 't1', eventId: 'event-1' }, async () => {
        order.push('work')
      })

      expect(order).toEqual(['lock', 'purge', 'work'])
      expect(tx.seatAssignment.deleteMany).toHaveBeenCalledWith({
        where: { eventId: 'event-1', guest: { invitations: { none: SEATABLE } } },
      })
    })

    it('gives the work seated ids, replace and update scoped to the table', async () => {
      const { tx, repo } = buildDb()

      await repo.withLockedTable({ id: 't1', eventId: 'event-1' }, async (lock) => {
        expect(await lock.seatedGuestIds()).toEqual([1])
        await lock.replaceAssignments([7, 8])
        await lock.updateTable({ capacity: 6 })
      })

      expect(tx.seatAssignment.findMany).toHaveBeenCalledWith({
        where: { tableId: 't1' },
        select: { guestId: true },
      })
      expect(tx.seatAssignment.deleteMany).toHaveBeenLastCalledWith({
        where: { eventId: 'event-1', guestId: { in: [7, 8] } },
      })
      expect(tx.seatAssignment.createMany).toHaveBeenCalledWith({
        data: [
          { eventId: 'event-1', tableId: 't1', guestId: 7 },
          { eventId: 'event-1', tableId: 't1', guestId: 8 },
        ],
      })
      expect(tx.seatingTable.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { capacity: 6 },
      })
    })

    it('translates a duplicate-seat database error into SeatAlreadyTakenError', async () => {
      const { tx, repo } = buildDb()
      tx.seatAssignment.createMany.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        })
      )

      await expect(
        repo.withLockedTable({ id: 't1', eventId: 'event-1' }, (lock) =>
          lock.replaceAssignments([7])
        )
      ).rejects.toBeInstanceOf(SeatAlreadyTakenError)
    })

    it('passes other errors through unchanged', async () => {
      const { repo } = buildDb()
      const boom = new Error('boom')

      await expect(
        repo.withLockedTable({ id: 't1', eventId: 'event-1' }, async () => {
          throw boom
        })
      ).rejects.toBe(boom)
    })

    it('exposes the table row read under the lock', async () => {
      const { repo } = buildDb()

      const row = await repo.withLockedTable(
        { id: 't1', eventId: 'event-1' },
        async (lock) => lock.table
      )

      expect(row).toEqual({ name: 'T1', capacity: 6 })
    })

    it('throws SeatingTableNotFoundError when the table was deleted before the lock', async () => {
      const { tx, repo } = buildDb()
      tx.$queryRaw.mockResolvedValue([])
      const work = jest.fn()

      await expect(
        repo.withLockedTable({ id: 't1', eventId: 'event-1' }, work)
      ).rejects.toBeInstanceOf(SeatingTableNotFoundError)
      expect(work).not.toHaveBeenCalled()
      expect(tx.seatAssignment.deleteMany).not.toHaveBeenCalled()
    })
  })
})
