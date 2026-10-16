import type { Prisma } from '@prisma/client'
import type { AuditEntry } from '~/lib/etta/types'
import { logger } from '~/lib/observability/logger'
import { db } from '~/server/db'

export async function logAudit(entry: AuditEntry) {
  try {
    await db.auditLog.create({
      data: {
        weddingId: entry.weddingId,
        actorId: entry.actorId,
        actorType: entry.actorType,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        tier: entry.tier,
        payloadSnapshot: (entry.payload as Prisma.InputJsonValue) ?? undefined,
      },
    })
  } catch (error) {
    logger.error(
      'Etta audit log failed',
      { component: 'etta', wedding_id: entry.weddingId, action: entry.action },
      error
    )
  }
}
