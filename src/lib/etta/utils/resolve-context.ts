import type { EttaActorType, EttaContext } from '~/lib/etta/types'
import { db } from '~/server/db'

export async function resolveEttaContext(params: {
  actor: EttaActorType
  weddingId: string
  guestId?: number
}): Promise<EttaContext> {
  const { actor, weddingId, guestId } = params

  const ettaActor = await db.ettaActor.findUnique({ where: { weddingId } })
  if (!ettaActor) {
    throw new Error('Etta not provisioned for this wedding')
  }

  const [wedding, guestCount, eventCount, vendorCount, pendingSuggestionCount, memories] =
    await Promise.all([
      db.wedding.findUnique({ where: { id: weddingId } }),
      db.guest.count({ where: { weddingId } }),
      db.event.count({ where: { weddingId } }),
      db.vendor.count({ where: { weddingId } }),
      db.ettaSuggestion.count({ where: { weddingId, status: 'pending' } }),
      db.ettaMemory.findMany({
        where: { weddingId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

  return {
    weddingId,
    ettaActorId: ettaActor.id,
    actor,
    guestId,
    wedding: {
      groomFirstName: wedding!.groomFirstName,
      groomLastName: wedding!.groomLastName,
      brideFirstName: wedding!.brideFirstName,
      brideLastName: wedding!.brideLastName,
    },
    guestCount,
    eventCount,
    vendorCount,
    pendingSuggestionCount,
    recentMemories: memories.map((m: { content: string }) => m.content),
  }
}
