import { db } from '~/server/db'
import { ETTA_DEFAULT_PERMISSIONS } from '~/lib/etta/types'

export async function provisionEtta(weddingId: string) {
  // Single upsert — idempotent, no race condition
  await db.ettaActor.upsert({
    where: { weddingId },
    create: {
      weddingId,
      actorType: 'etta',
      permissions: [...ETTA_DEFAULT_PERMISSIONS],
    },
    update: {}, // no-op if already exists
  })

  console.log(`[Etta] Provisioned actor for wedding ${weddingId}`)
}

export async function revokeEtta(weddingId: string) {
  await db.ettaActor.updateMany({
    where: { weddingId, revokedAt: null },
    data: { revokedAt: new Date() },
  })

  console.log(`[Etta] Revoked actor for wedding ${weddingId}`)
}
