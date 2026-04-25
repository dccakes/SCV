import { z } from 'zod'
import {
  type ActionType,
  type Domain,
  ETTA_SUGGESTION_ACTION_TYPES,
  ETTA_SUGGESTION_DOMAINS,
  ETTA_SUGGESTION_STATUSES,
  type EttaSuggestionView,
  type SuggestionStatus,
} from '~/lib/etta/types'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { db } from '~/server/db'
import {
  getReadableSuggestionDomains,
  requireSuggestionDomainReadPermission,
} from '~/server/domains/etta-suggestion/etta-suggestion.auth'

const tierSchema = z.enum(['T1', 'T2'])
const domainSchema = z.enum(ETTA_SUGGESTION_DOMAINS).catch('other')
const actionTypeSchema = z.enum(ETTA_SUGGESTION_ACTION_TYPES).catch('other')
const statusSchema = z.enum(ETTA_SUGGESTION_STATUSES).catch('pending')
const genericPayloadSchema = z.record(z.string(), z.unknown())
const payloadSchemaByActionType = {
  add_vendor: z.object({
    name: z.string(),
    category: z.string(),
    contactName: z.string().optional(),
    contactEmail: z.string().optional(),
    website: z.string().optional(),
  }),
  upsert_budget_item: z.object({
    category: z.string(),
    description: z.string(),
    estimated: z.number(),
    actual: z.number().optional(),
  }),
  send_whatsapp_blast: z.object({
    message: z.string(),
    recipientFilter: z.string().optional(),
  }),
  draft_vendor_email: z.object({
    vendorId: z.string(),
    subject: z.string(),
    body: z.string(),
  }),
  suggest_venue_visit: genericPayloadSchema,
  guest_followup: z.object({
    guestId: z.string().optional(),
    guestIds: z.array(z.string()).optional(),
    message: z.string(),
    channel: z.enum(['email', 'sms', 'whatsapp', 'other']).optional(),
  }),
  other: genericPayloadSchema,
} satisfies Record<ActionType, z.ZodTypeAny>

const suggestionViewSelect = {
  id: true,
  summary: true,
  tier: true,
  domain: true,
  actionType: true,
  status: true,
  createdAt: true,
  executedAt: true,
  failureReason: true,
  payload: true,
} as const

function toSuggestionView(suggestion: {
  id: string
  summary: string
  tier: string
  domain: string
  actionType: string
  status: string
  createdAt: Date
  executedAt: Date | null
  failureReason: string | null
  payload: unknown
}): EttaSuggestionView {
  const actionType = actionTypeSchema.parse(suggestion.actionType) as ActionType

  return {
    id: suggestion.id,
    summary: suggestion.summary,
    tier: tierSchema.parse(suggestion.tier),
    domain: domainSchema.parse(suggestion.domain) as Domain,
    actionType,
    status: statusSchema.parse(suggestion.status) as SuggestionStatus,
    createdAt: suggestion.createdAt.toISOString(),
    executedAt: suggestion.executedAt?.toISOString() ?? null,
    failureReason: suggestion.failureReason,
    payload: payloadSchemaByActionType[actionType].parse(suggestion.payload),
  }
}

function emptyCounts(): Record<Domain, number> {
  return Object.fromEntries(ETTA_SUGGESTION_DOMAINS.map((domain) => [domain, 0])) as Record<
    Domain,
    number
  >
}

export const ettaSuggestionService = {
  async getPendingByDomain(params: {
    authz: AuthzContext
    weddingId: string
    domain: Domain
  }): Promise<EttaSuggestionView[]> {
    requireSuggestionDomainReadPermission(params.authz, params.domain)

    const suggestions = await db.ettaSuggestion.findMany({
      where: {
        weddingId: params.weddingId,
        domain: params.domain,
        status: 'pending',
      },
      orderBy: { createdAt: 'desc' },
      select: suggestionViewSelect,
    })

    return suggestions.map(toSuggestionView)
  },

  async getPendingCounts(params: {
    authz: AuthzContext
    weddingId: string
  }): Promise<Record<Domain, number>> {
    const readableDomains = getReadableSuggestionDomains(params.authz)

    if (readableDomains.length === 0) {
      return emptyCounts()
    }

    const grouped = await db.ettaSuggestion.groupBy({
      by: ['domain'],
      where: {
        weddingId: params.weddingId,
        domain: { in: readableDomains },
        status: 'pending',
      },
      _count: {
        _all: true,
      },
    })

    return grouped.reduce((counts, row) => {
      counts[row.domain as Domain] = row._count._all
      return counts
    }, emptyCounts())
  },

  async getAll(params: {
    authz: AuthzContext
    weddingId: string
    status?: SuggestionStatus
  }): Promise<EttaSuggestionView[]> {
    const readableDomains = getReadableSuggestionDomains(params.authz)

    if (readableDomains.length === 0) {
      return []
    }

    const suggestions = await db.ettaSuggestion.findMany({
      where: {
        weddingId: params.weddingId,
        domain: { in: readableDomains },
        ...(params.status ? { status: params.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: suggestionViewSelect,
      take: 100,
    })

    return suggestions.map(toSuggestionView)
  },
}
