/**
 * Analytics Event Taxonomy (shared client + server)
 *
 * All analytics events use a standardized, dot-delimited, snake_case name:
 *
 *     {scope}.{object?}.{action}
 *
 * - `scope`  — the product area the event belongs to (e.g. `guest_list`, `vendor`).
 * - `object` — the concrete thing acted upon (e.g. `household`, `quote_file`). Optional.
 * - `action` — a canonical verb from {@link ANALYTICS_ACTIONS} (e.g. `added`, `updated`).
 *
 * Keeping the vocabulary small and centralized means every producer (the tRPC
 * middleware, the React client, template pages) emits consistent names that are
 * trivial to group and filter in PostHog.
 */

/**
 * Canonical product scopes. Front-end scopes and API-router scopes are unified
 * here so a "guest list household added" event reads the same whether it came
 * from the dashboard UI or the backend mutation.
 */
export const ANALYTICS_SCOPES = {
  account: 'account',
  wedding: 'wedding',
  website: 'website',
  event: 'event',
  guestList: 'guest_list',
  rsvp: 'rsvp',
  vendor: 'vendor',
  checklist: 'checklist',
  milestone: 'milestone',
  gift: 'gift',
  messaging: 'messaging',
  selfFill: 'self_fill',
  dashboard: 'dashboard',
  template: 'template',
  asset: 'asset',
} as const

export type AnalyticsScope = (typeof ANALYTICS_SCOPES)[keyof typeof ANALYTICS_SCOPES]

/**
 * Canonical action verbs. Past-tense per PostHog convention ("household added").
 * `triggered` is the catch-all fallback for actions without a dedicated verb.
 */
export const ANALYTICS_ACTIONS = {
  added: 'added',
  created: 'created',
  updated: 'updated',
  saved: 'saved',
  removed: 'removed',
  deleted: 'deleted',
  viewed: 'viewed',
  clicked: 'clicked',
  submitted: 'submitted',
  started: 'started',
  uploaded: 'uploaded',
  imported: 'imported',
  verified: 'verified',
  completed: 'completed',
  attested: 'attested',
  dismissed: 'dismissed',
  cleared: 'cleared',
  toggled: 'toggled',
  registered: 'registered',
  generated: 'generated',
  revoked: 'revoked',
  sent: 'sent',
  rated: 'rated',
  received: 'received',
  triggered: 'triggered',
} as const

export type AnalyticsAction = (typeof ANALYTICS_ACTIONS)[keyof typeof ANALYTICS_ACTIONS]

/**
 * Normalize an arbitrary label to a lowercase snake_case segment.
 * `coverPhoto` -> `cover_photo`, `Family Member` -> `family_member`.
 */
export function toSegment(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s\-.]+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase()
}

export interface EventNameParts {
  scope: string
  object?: string
  action: string
}

/**
 * Build a canonical event name from its parts, normalizing each segment.
 */
export function buildEventName({ scope, object, action }: EventNameParts): string {
  const segments = [toSegment(scope), object ? toSegment(object) : null, toSegment(action)].filter(
    (segment): segment is string => Boolean(segment)
  )
  return segments.join('.')
}

/**
 * Explicit map from a tRPC procedure path (`router.procedure`) to a canonical
 * event name. This is the source of truth for the important, human-named
 * backend events. Anything not listed here falls back to {@link deriveEventName}.
 */
export const TRPC_EVENT_MAP: Record<string, string> = {
  // Account / user
  'user.updateProfile': 'account.profile.updated',

  // Wedding
  'wedding.create': 'wedding.added',
  'wedding.update': 'wedding.updated',
  'wedding.updateDetails': 'wedding.details.updated',
  'wedding.toggleAddOn': 'wedding.addon.toggled',

  // Website builder
  'website.create': 'website.added',
  'website.update': 'website.updated',
  'website.updateIsRsvpEnabled': 'website.rsvp_enabled.updated',
  'website.updateCoverPhoto': 'website.cover_photo.updated',
  'website.updateHeaderImage': 'website.header_image.updated',
  'website.updateCoupleImages': 'website.couple_images.updated',
  'website.updateTemplate': 'website.template.updated',
  'website.verifyWebsitePassword': 'website.password.verified',
  'website.submitPublicRsvpForm': 'rsvp.public_submission.submitted',
  'websiteSection.updateHomeSection': 'website.home_section.updated',
  'websiteSection.upsertSection': 'website.section.saved',

  // Events
  'event.create': 'event.added',
  'event.update': 'event.updated',
  'event.updateCollectRsvp': 'event.rsvp_collection.updated',
  'event.delete': 'event.removed',

  // RSVP questions & submissions
  'question.upsert': 'rsvp.question.saved',
  'question.delete': 'rsvp.question.removed',
  'rsvpSubmission.submit': 'rsvp.managed_submission.submitted',

  // Guest list — households, guests, tags, invitations, communication
  'household.create': 'guest_list.household.added',
  'household.update': 'guest_list.household.updated',
  'household.bulkCreate': 'guest_list.household.imported',
  'household.delete': 'guest_list.household.removed',
  'guestTag.create': 'guest_list.tag.added',
  'guestTag.update': 'guest_list.tag.updated',
  'guestTag.delete': 'guest_list.tag.removed',
  'invitation.create': 'guest_list.invitation.added',
  'invitation.update': 'guest_list.invitation.updated',
  'invitation.bulkUpdate': 'guest_list.invitation.bulk_updated',
  'communicationLog.addNote': 'guest_list.communication_note.added',
  'communicationLog.deleteNote': 'guest_list.communication_note.removed',

  // Self-fill guest registration
  'selfFill.registerGuest': 'self_fill.guest.registered',
  'selfFill.generateToken': 'self_fill.token.generated',
  'selfFill.revokeToken': 'self_fill.token.revoked',

  // Vendors
  'vendor.create': 'vendor.added',
  'vendor.update': 'vendor.updated',
  'vendor.delete': 'vendor.removed',
  'vendor.updateStatus': 'vendor.status.updated',
  'vendor.addNote': 'vendor.note.added',
  'vendor.upsertCategoryConfig': 'vendor.category_config.saved',
  'vendor.addQuote': 'vendor.quote.added',
  'vendor.updateQuote': 'vendor.quote.updated',
  'vendor.deleteQuote': 'vendor.quote.removed',
  'vendor.saveQuoteFiles': 'vendor.quote_file.uploaded',
  'vendor.deleteQuoteFile': 'vendor.quote_file.removed',
  'vendor.saveImages': 'vendor.image.uploaded',
  'vendor.deleteImage': 'vendor.image.removed',
  'vendor.setCoverImage': 'vendor.cover_image.updated',
  'vendor.setRating': 'vendor.rating.updated',

  // Checklist tasks
  'task.create': 'checklist.task.added',
  'task.update': 'checklist.task.updated',
  'task.complete': 'checklist.task.completed',
  'task.delete': 'checklist.task.removed',

  // Milestones
  'milestone.attest': 'milestone.attested',
  'milestone.dismiss': 'milestone.dismissed',
  'milestone.clearOverride': 'milestone.override.cleared',

  // Gift registry
  'gift.update': 'gift.registry.updated',

  // Messaging (Telegram couple-bot)
  'messaging.createPairingToken': 'messaging.pairing_token.generated',
  'messaging.revokeIdentity': 'messaging.identity.revoked',
}

/**
 * Map a procedure verb prefix to a canonical action. Ordered longest-first so
 * `updateCollect` matches `update` and `bulkCreate`-style names still resolve.
 */
const VERB_TO_ACTION: Array<[string, AnalyticsAction]> = [
  ['bulkCreate', ANALYTICS_ACTIONS.imported],
  ['bulkUpdate', ANALYTICS_ACTIONS.updated],
  ['create', ANALYTICS_ACTIONS.added],
  ['add', ANALYTICS_ACTIONS.added],
  ['update', ANALYTICS_ACTIONS.updated],
  ['upsert', ANALYTICS_ACTIONS.saved],
  ['save', ANALYTICS_ACTIONS.saved],
  ['set', ANALYTICS_ACTIONS.updated],
  ['edit', ANALYTICS_ACTIONS.updated],
  ['delete', ANALYTICS_ACTIONS.removed],
  ['remove', ANALYTICS_ACTIONS.removed],
  ['revoke', ANALYTICS_ACTIONS.revoked],
  ['complete', ANALYTICS_ACTIONS.completed],
  ['attest', ANALYTICS_ACTIONS.attested],
  ['dismiss', ANALYTICS_ACTIONS.dismissed],
  ['toggle', ANALYTICS_ACTIONS.toggled],
  ['verify', ANALYTICS_ACTIONS.verified],
  ['submit', ANALYTICS_ACTIONS.submitted],
  ['register', ANALYTICS_ACTIONS.registered],
  ['generate', ANALYTICS_ACTIONS.generated],
  ['import', ANALYTICS_ACTIONS.imported],
  ['upload', ANALYTICS_ACTIONS.uploaded],
]

/**
 * Derive a canonical event name from an unmapped tRPC path using verb
 * heuristics. `gadget.updateColor` -> `gadget.color.updated`.
 */
export function deriveEventName(path: string): string {
  const [router, procedure = ''] = path.split('.')
  const scope = toSegment(router ?? path)

  for (const [verb, action] of VERB_TO_ACTION) {
    if (procedure === verb) {
      return buildEventName({ scope, action })
    }
    if (procedure.startsWith(verb) && procedure.length > verb.length) {
      const object = procedure.slice(verb.length)
      return buildEventName({ scope, object, action })
    }
  }

  // Unknown verb: keep the procedure as the object and mark it generically.
  return buildEventName({ scope, object: procedure, action: ANALYTICS_ACTIONS.triggered })
}

/**
 * Resolve the canonical event name for a tRPC procedure path, preferring the
 * explicit {@link TRPC_EVENT_MAP} and falling back to {@link deriveEventName}.
 */
export function resolveTrpcEventName(path: string): string {
  return TRPC_EVENT_MAP[path] ?? deriveEventName(path)
}
