import type { ModelMessage } from 'ai'
import type { AuthzContext } from '~/server/authz/authorization.types'

// ── Actor Types ──────────────────────────────────────────────────────────────

export type EttaActorType = 'couple' | 'guest' | 'couple-bot' | 'couple-background'

export type EttaPersona = 'planner' | 'concierge'

export type EttaToolsetMode = 'full' | 'memory-only' | 'background-execution'

// ── Request / Context ────────────────────────────────────────────────────────

export interface EttaRequest {
  actor: EttaActorType
  weddingId: string
  guestId?: number
  authz?: AuthzContext
  messages: ModelMessage[]
  toolsetMode?: EttaToolsetMode
  approvedSuggestionActionType?: ActionType
}

export interface EttaContext {
  weddingId: string
  ettaActorId: string
  actor: EttaActorType
  guestId?: number
  authz?: AuthzContext

  // Wedding snapshot injected into system prompt
  wedding: {
    groomFirstName: string
    groomLastName: string
    brideFirstName: string
    brideLastName: string
  }
  guestCount: number
  eventCount: number
  vendorCount: number
  pendingSuggestionCount: number
  recentMemories: string[]
}

// ── Action Tiers ─────────────────────────────────────────────────────────────

export type ActionTier = 'T0' | 'T1' | 'T2'

export const ETTA_SUGGESTION_DOMAINS = [
  'guests',
  'events',
  'rsvp',
  'vendors',
  'budget',
  'tasks',
  'other',
] as const

export type Domain = (typeof ETTA_SUGGESTION_DOMAINS)[number]

export const ETTA_SUGGESTION_ACTION_TYPES = [
  'add_vendor',
  'upsert_budget_item',
  'send_whatsapp_blast',
  'draft_vendor_email',
  'suggest_venue_visit',
  'guest_followup',
  'other',
] as const

export type ActionType = (typeof ETTA_SUGGESTION_ACTION_TYPES)[number]

export const ETTA_SUGGESTION_STATUSES = [
  'pending',
  'approved',
  'dismissed',
  'actioned',
  'failed',
] as const

export type SuggestionStatus = (typeof ETTA_SUGGESTION_STATUSES)[number]

export interface VendorDraft {
  name: string
  category: string
  contactName?: string
  contactEmail?: string
  website?: string
}

export interface BudgetItemDraft {
  category: string
  description: string
  estimated: number
  actual?: number
}

export interface WhatsAppBlastDraft {
  message: string
  recipientFilter?: string
}

export interface VendorEmailDraft {
  vendorId: string
  subject: string
  body: string
}

export interface GuestFollowupDraft {
  guestId?: string
  guestIds?: string[]
  message: string
  channel?: 'email' | 'sms' | 'whatsapp' | 'other'
}

export type GenericSuggestionPayload = Record<string, unknown>

export interface EttaSuggestionPayloadMap {
  add_vendor: VendorDraft
  upsert_budget_item: BudgetItemDraft
  send_whatsapp_blast: WhatsAppBlastDraft
  draft_vendor_email: VendorEmailDraft
  suggest_venue_visit: GenericSuggestionPayload
  guest_followup: GuestFollowupDraft
  other: GenericSuggestionPayload
}

export type EttaSuggestionPayload = EttaSuggestionPayloadMap[ActionType]

// ── Permissions ──────────────────────────────────────────────────────────────

export const ETTA_DEFAULT_PERMISSIONS = [
  'read:wedding_core',
  'read:guests',
  'read:budget',
  'read:vendors',
  'read:timeline',
  'write:memory',
  'write:suggestions',
  'write:milestone_status',
  'write:faq',
  'execute:approved_actions',
] as const

export type EttaPermission = (typeof ETTA_DEFAULT_PERMISSIONS)[number]

// ── Suggestion (shared by UI components) ─────────────────────────────────────

export interface EttaSuggestionView {
  id: string
  summary: string
  tier: 'T1' | 'T2'
  domain: Domain
  actionType: ActionType
  status: SuggestionStatus
  createdAt: string
  executedAt?: string | null
  failureReason?: string | null
  payload: EttaSuggestionPayload
}

// ── Audit ────────────────────────────────────────────────────────────────────

export interface AuditEntry {
  weddingId: string
  actorId: string
  actorType: 'etta' | 'couple' | 'guest' | 'couple-bot'
  action: string
  resourceType: string
  resourceId?: string
  tier?: ActionTier
  payload?: unknown
}
