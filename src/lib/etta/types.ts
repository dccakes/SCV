import type { ModelMessage } from 'ai'

// ── Actor Types ──────────────────────────────────────────────────────────────

export type EttaActorType = 'couple' | 'guest'

export type EttaPersona = 'planner' | 'concierge'

// ── Request / Context ────────────────────────────────────────────────────────

export interface EttaRequest {
  actor: EttaActorType
  weddingId: string
  guestId?: number
  messages: ModelMessage[]
}

export interface EttaContext {
  weddingId: string
  ettaActorId: string
  actor: EttaActorType
  guestId?: number

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

export type SuggestionStatus = 'pending' | 'approved' | 'dismissed' | 'executed'

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
  actionType: string
  createdAt: string
  payload: Record<string, unknown>
}

// ── Audit ────────────────────────────────────────────────────────────────────

export interface AuditEntry {
  weddingId: string
  actorId: string
  actorType: 'etta' | 'couple' | 'guest'
  action: string
  resourceType: string
  resourceId?: string
  tier?: ActionTier
  payload?: unknown
}
