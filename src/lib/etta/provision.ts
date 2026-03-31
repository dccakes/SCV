import { db } from '~/server/db'
import { ETTA_DEFAULT_PERMISSIONS } from '~/lib/etta/types'

export async function provisionEtta(weddingId: string) {
  const existing = await db.ettaActor.findUnique({
    where: { weddingId },
  })

  if (existing) {
    console.log(`[Etta] Actor already provisioned for wedding ${weddingId}`)
    return
  }

  await db.ettaActor.create({
    data: {
      weddingId,
      actorType: 'etta',
      permissions: [...ETTA_DEFAULT_PERMISSIONS],
    },
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
