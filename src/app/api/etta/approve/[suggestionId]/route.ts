/**
 * PATCH /api/etta/approve/:suggestionId — Approve or dismiss a suggestion
 *
 * Couples only. Validates session, checks suggestion ownership,
 * and updates status to approved/dismissed.
 */

import { VendorCategory } from '@prisma/client'
import { z } from 'zod'
import { runApprovedSuggestion } from '~/lib/etta/execution/run-approved-suggestion'
import { logAudit } from '~/lib/etta/utils/audit'
import { validateCoupleSession } from '~/lib/etta/utils/auth'
import { inferEttaHttpStatus } from '~/lib/etta/utils/http'
import { db } from '~/server/db'
import { requireSuggestionReviewPermission } from '~/server/domains/etta-suggestion/etta-suggestion.auth'
import { fieldDefinitionSchema, vendorService } from '~/server/domains/vendor'

const bodySchema = z.object({
  action: z.enum(['approve', 'dismiss']),
})

const suggestVendorFieldPayloadSchema = z.object({
  category: z.enum(VendorCategory),
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'number', 'boolean']),
  reason: z.string().min(1),
})

class ApprovalRouteError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = 'ApprovalRouteError'
  }
}

type SuggestionRecord = Awaited<ReturnType<typeof db.ettaSuggestion.findUnique>>

async function executeApprovalAction(
  suggestion: NonNullable<SuggestionRecord>,
  authz: Awaited<ReturnType<typeof validateCoupleSession>>['authz'],
  weddingId: string
) {
  if (suggestion.actionType !== 'SUGGEST_VENDOR_FIELD') {
    return
  }

  const parsedPayload = suggestVendorFieldPayloadSchema.safeParse(suggestion.payload)
  if (!parsedPayload.success) {
    throw new ApprovalRouteError('Invalid suggestion payload for SUGGEST_VENDOR_FIELD', 400)
  }

  const { category, key, label, type } = parsedPayload.data
  const config = await vendorService.getCategoryConfig(authz, weddingId, category)
  const fieldDefinitions = z.array(fieldDefinitionSchema).parse(config.fieldDefinitions)

  if (fieldDefinitions.some((field) => field.key === key)) {
    return
  }

  const nextDisplayOrder =
    fieldDefinitions.reduce((maxOrder, field) => Math.max(maxOrder, field.displayOrder), -1) + 1
  // TODO(review-implementation): make approval-side config mutation and suggestion resolution atomic
  // in a transaction-owned domain flow to avoid read-modify-write races across concurrent approvals.
  await vendorService.upsertCategoryConfig(authz, weddingId, category, [
    ...fieldDefinitions,
    {
      key,
      label,
      type,
      displayOrder: nextDisplayOrder,
    },
  ])
}
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

    if (action === 'approve') {
      await executeApprovalAction(suggestion, authz, weddingId)
    }

    const executesInline = action === 'approve' && suggestion.actionType === 'SUGGEST_VENDOR_FIELD'
    const newStatus =
      action === 'approve' ? (executesInline ? 'actioned' : 'approved') : 'dismissed'
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
              executedAt: executesInline ? new Date() : null,
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

    if (action === 'approve' && !executesInline) {
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
    const status =
      error instanceof ApprovalRouteError ? error.status : inferEttaHttpStatus(error, message)

    return Response.json({ error: message }, { status })
  }
}
