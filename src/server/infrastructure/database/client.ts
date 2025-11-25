/**
 * Database Client - Infrastructure Layer
 *
 * This module re-exports the Prisma database client from its original location.
 * Part of the domain-driven architecture, this provides a clean abstraction
 * for database access that can be used by all domains and services.
 */

export { db } from '~/server/db'
