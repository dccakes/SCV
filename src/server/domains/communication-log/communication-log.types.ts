/**
 * Communication Log Domain - Types
 *
 * Type definitions for the unified communication log timeline.
 * System events (invitation sent, RSVP received, etc.) are derived from existing tables.
 * Only manual notes are stored in the HouseholdNote table.
 */

/**
 * Core HouseholdNote entity type (stored in DB)
 */
export type HouseholdNote = {
  id: string
  householdId: string
  weddingId: string
  message: string
  actorType: string
  createdAt: Date
}

/**
 * Unified communication log entry - discriminated union of all timeline event types.
 * System events are derived at query time from existing tables.
 * Only NOTE entries come from the HouseholdNote table.
 */
export type CommunicationLogEntry =
  | {
      type: 'INVITATION_SENT'
      message: string
      date: Date
      eventId: string
      eventName: string
    }
  | {
      type: 'RSVP_RECEIVED'
      message: string
      date: Date
      eventId: string
      eventName: string
      rsvp: string
      guestName: string
    }
  | {
      type: 'THANK_YOU_SENT'
      message: string
      date: Date
      eventId: string
      eventName: string
    }
  | {
      type: 'NOTE'
      message: string
      date: Date
      id: string
      actorType: string
    }
