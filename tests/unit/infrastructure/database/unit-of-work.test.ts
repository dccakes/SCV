import type { PrismaClient } from '@prisma/client'

import { createUnitOfWork } from '~/server/infrastructure/database/unit-of-work'

describe('createUnitOfWork', () => {
  it('runs the work inside one $transaction with repositories bound to the tx client', async () => {
    const tx = { id: 'tx' }
    const $transaction = jest.fn((fn: (client: unknown) => Promise<unknown>) => fn(tx))
    const db = { $transaction } as unknown as PrismaClient
    const build = jest.fn((client: unknown) => ({ repo: { client } }))

    const unitOfWork = createUnitOfWork(db, build)
    const result = await unitOfWork(async ({ repo }) => repo.client)

    expect($transaction).toHaveBeenCalledTimes(1)
    expect(build).toHaveBeenCalledWith(tx)
    expect(result).toBe(tx)
  })

  it('propagates errors so the transaction rolls back', async () => {
    const db = {
      $transaction: (fn: (client: unknown) => Promise<unknown>) => fn({}),
    } as unknown as PrismaClient
    const unitOfWork = createUnitOfWork(db, () => ({}))

    await expect(
      unitOfWork(async () => {
        throw new Error('boom')
      })
    ).rejects.toThrow('boom')
  })
})
