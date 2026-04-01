import type { EttaActorType, EttaContext } from '~/lib/etta/types'
import { db } from '~/server/db'

export async function resolveEttaContext(params: {
  actor: EttaActorType
  weddingId: string
  guestId?: number
}): Promise<EttaContext> {
  const { actor, weddingId, guestId } = params
  const isPlanner = actor === 'couple'

  // Single parallel batch — concierge skips planner-only queries
  const [ettaActor, wedding, guestCount, eventCount, vendorCount, pendingSuggestionCount, memories] =
    await Promise.all([
      db.ettaActor.findUnique({ where: { weddingId } }),
      db.wedding.findUnique({ where: { id: weddingId } }),
      db.guest.count({ where: { weddingId } }),
      db.event.count({ where: { weddingId } }),
      isPlanner ? db.vendor.count({ where: { weddingId } }) : 0,
      isPlanner ? db.ettaSuggestion.count({ where: { weddingId, status: 'pending' } }) : 0,
      isPlanner
        ? db.ettaMemory.findMany({
            where: { weddingId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { content: true },
          })
        : [],
    ])

  if (!ettaActor) {
    throw new Error('Etta not provisioned for this wedding')
  }

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
    recentMemories: memories.map((m) => m.content),
  }
}
