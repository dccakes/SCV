/**
 * PATCH /api/etta/approve/:suggestionId — Approve or dismiss a suggestion
 *
 * Couples only. Validates session, checks suggestion ownership,
 * and updates status to approved/dismissed.
 */

import { validateCoupleSession } from '~/lib/etta/utils/auth'
import { logAudit } from '~/lib/etta/utils/audit'
import { db } from '~/server/db'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ suggestionId: string }> }
) {
  try {
    const { weddingId, userId } = await validateCoupleSession(req.headers)
    const { suggestionId } = await params

    const body = await req.json()
    const action = body.action as 'approve' | 'dismiss'

    if (!action || !['approve', 'dismiss'].includes(action)) {
      return Response.json(
        { error: 'Invalid action. Must be "approve" or "dismiss".' },
        { status: 400 }
      )
    }

    // Fetch suggestion and verify ownership
    const suggestion = await db.ettaSuggestion.findUnique({
      where: { id: suggestionId },
    })

    if (!suggestion || suggestion.weddingId !== weddingId) {
      return Response.json({ error: 'Suggestion not found' }, { status: 404 })
    }

    if (suggestion.status !== 'pending') {
      return Response.json(
        { error: `Suggestion already ${suggestion.status}` },
        { status: 409 }
      )
    }

    // Update suggestion status
    const newStatus = action === 'approve' ? 'approved' : 'dismissed'
    const updated = await db.ettaSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: newStatus,
        resolvedAt: new Date(),
        resolvedBy: userId,
      },
    })

    // Audit the action
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
    const message =
      error instanceof Error ? error.message : 'Internal server error'
    const status = message === 'No active session' ? 401 : 500

    return Response.json({ error: message }, { status })
  }
}
