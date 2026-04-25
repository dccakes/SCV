/**
 * PATCH /api/etta/approve/:suggestionId — Approve or dismiss a suggestion
 *
 * Couples only. Validates session, checks suggestion ownership,
 * and updates status to approved/dismissed.
 */

import { z } from 'zod'
import { runApprovedSuggestion } from '~/lib/etta/execution/run-approved-suggestion'
import { logAudit } from '~/lib/etta/utils/audit'
import { validateCoupleSession } from '~/lib/etta/utils/auth'
import { inferEttaHttpStatus } from '~/lib/etta/utils/http'
import { db } from '~/server/db'
import { requireSuggestionReviewPermission } from '~/server/domains/etta-suggestion/etta-suggestion.auth'

const bodySchema = z.object({
  action: z.enum(['approve', 'dismiss']),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ suggestionId: string }> }
) {
  try {
    const { weddingId, userId, authz } = await validateCoupleSession(req.headers)
    requireSuggestionReviewPermission(authz)
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

    if (action === 'approve' && suggestion.status === 'approved') {
      return Response.json({
        id: suggestion.id,
        status: suggestion.status,
        message: 'Suggestion already approved',
      })
    }

    const isRetry = action === 'approve' && suggestion.status === 'failed'
    const canApprove = suggestion.status === 'pending' || isRetry
    const canDismiss = suggestion.status === 'pending' || suggestion.status === 'failed'

    if ((action === 'approve' && !canApprove) || (action === 'dismiss' && !canDismiss)) {
      return Response.json({ error: `Suggestion already ${suggestion.status}` }, { status: 409 })
    }

    const newStatus = action === 'approve' ? 'approved' : 'dismissed'
    const updatedCount = await db.ettaSuggestion.updateMany({
      where: {
        id: suggestionId,
        weddingId,
        status: suggestion.status,
      },
      data: {
        status: newStatus,
        resolvedAt: new Date(),
        resolvedBy: userId,
        ...(action === 'approve'
          ? {
              executedAt: null,
              failureReason: null,
            }
          : {}),
      },
    })

    if (updatedCount.count === 0) {
      return Response.json(
        { error: 'Suggestion state changed. Refresh and try again.' },
        { status: 409 }
      )
    }

    if (action === 'approve') {
      // TODO(review-architect): replace in-process handoff with a durable execution queue/outbox.
      void runApprovedSuggestion({
        suggestion: {
          ...suggestion,
          status: newStatus,
          executedAt: null,
          failureReason: null,
        },
        authz,
      }).catch((error) => {
        // biome-ignore lint/suspicious/noConsole: fire-and-forget background task logging
        console.error('[Etta] Failed to start approved suggestion execution:', error)
      })
    }

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
      id: suggestionId,
      status: newStatus,
      message: `Suggestion ${newStatus}`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = inferEttaHttpStatus(error, message)

    return Response.json({ error: message }, { status })
  }
}
