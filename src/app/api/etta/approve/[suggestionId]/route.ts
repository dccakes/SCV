/**
 * PATCH /api/etta/approve/:suggestionId — Approve or dismiss a suggestion
 *
 * Couples only. Validates session, checks suggestion ownership,
 * and updates status to approved/dismissed.
 */

import { z } from 'zod'
import { logAudit } from '~/lib/etta/utils/audit'
import { EttaAuthError, validateCoupleSession } from '~/lib/etta/utils/auth'
import { db } from '~/server/db'

const bodySchema = z.object({
  action: z.enum(['approve', 'dismiss']),
})

const inferAuthStatus = (error: unknown, message: string): number => {
  if (error instanceof EttaAuthError) {
    return error.status
  }
  if (message === 'No active session') {
    return 401
  }
  if (message === 'No active wedding in workspace scope') {
    return 412
  }
  return 500
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ suggestionId: string }> }
) {
  try {
    const { weddingId, userId } = await validateCoupleSession(req.headers)
    const { suggestionId } = await params

    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid action. Must be "approve" or "dismiss".' },
        { status: 400 }
      )
    }
    const { action } = parsed.data

    const suggestion = await db.ettaSuggestion.findUnique({
      where: { id: suggestionId },
    })

    if (!suggestion || suggestion.weddingId !== weddingId) {
      return Response.json({ error: 'Suggestion not found' }, { status: 404 })
    }

    if (suggestion.status !== 'pending') {
      return Response.json({ error: `Suggestion already ${suggestion.status}` }, { status: 409 })
    }

    const newStatus = action === 'approve' ? 'approved' : 'dismissed'
    const updated = await db.ettaSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: newStatus,
        resolvedAt: new Date(),
        resolvedBy: userId,
      },
    })

    await logAudit({
      weddingId,
      actorId: userId,
      actorType: 'couple',
      action: `suggestion_${action}`,
      resourceType: 'etta_suggestion',
      resourceId: suggestionId,
      tier: suggestion.tier as 'T1' | 'T2',
      payload: { actionType: suggestion.actionType, summary: suggestion.summary },
    })

    return Response.json({
      id: updated.id,
      status: updated.status,
      message: `Suggestion ${newStatus}`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = inferAuthStatus(error, message)

    return Response.json({ error: message }, { status })
  }
}
