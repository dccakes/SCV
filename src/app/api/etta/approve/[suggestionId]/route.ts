/**
 * PATCH /api/etta/approve/:suggestionId — Approve or dismiss a suggestion
 *
 * Couples only. Validates session, checks suggestion ownership,
 * and updates status to approved/dismissed.
 */

import { VendorCategory } from '@prisma/client'
import { z } from 'zod'
import { logAudit } from '~/lib/etta/utils/audit'
import { EttaAuthError, validateCoupleSession } from '~/lib/etta/utils/auth'
import { db } from '~/server/db'
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

const inferAuthStatus = (error: unknown, message: string): number => {
  if (error instanceof ApprovalRouteError) {
    return error.status
  }
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

    if (action === 'approve') {
      await executeApprovalAction(suggestion, authz, weddingId)
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
