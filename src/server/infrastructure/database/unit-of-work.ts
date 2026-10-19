/**
 * Database Infrastructure - Unit of Work
 *
 * Lets services run several repository calls atomically without depending on
 * Prisma. The wiring code (domain/application barrels) decides which
 * repositories are bound to the transaction; services only see `UnitOfWork<R>`.
 *
 * ```ts
 * // barrel
 * const unitOfWork = createUnitOfWork(db, (tx) => ({
 *   event: new EventRepository(tx),
 *   invitation: new InvitationRepository(tx),
 * }))
 * // service
 * await this.unitOfWork(async ({ event, invitation }) => { ... })
 * ```
 */

import type { Prisma, PrismaClient } from '@prisma/client'

export type TransactionClient = Prisma.TransactionClient

export type UnitOfWork<R> = <T>(work: (repos: R) => Promise<T>) => Promise<T>

export function createUnitOfWork<R>(
  db: PrismaClient,
  build: (tx: TransactionClient) => R
): UnitOfWork<R> {
  return (work) => db.$transaction((tx) => work(build(tx)))
}
