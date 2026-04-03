import { tool, zodSchema } from 'ai'
import { z } from 'zod'

import { RSVP_STATUS } from '~/lib/constants/rsvp'
import type { EttaContext } from '~/lib/etta/types'
import { requireEttaPermission, requirePlannerAuthz } from '~/lib/etta/utils/authorization'
import { eventService } from '~/server/domains/event'
import { guestService } from '~/server/domains/guest'
import { invitationService } from '~/server/domains/invitation'

const rsvpFilterSchema = z.enum([
  RSVP_STATUS.ATTENDING,
  RSVP_STATUS.DECLINED,
  RSVP_STATUS.INVITED,
  RSVP_STATUS.NOT_INVITED,
])

function normalizeSearchValue(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase()
}

function buildGuestSearchIndex(guest: {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  householdId?: string | null
}) {
  return [
    guest.firstName,
    guest.lastName,
    `${guest.firstName ?? ''} ${guest.lastName ?? ''}`.trim(),
    guest.email,
    guest.householdId,
  ]
    .map(normalizeSearchValue)
    .filter(Boolean)
}

function buildGuestName(guest: { firstName?: string | null; lastName?: string | null }) {
  return [guest.firstName, guest.lastName].filter(Boolean).join(' ').trim()
}

export function getGuestTools(ctx: EttaContext) {
  return {
    get_guest_list: tool({
      description: 'Get the complete guest list for the wedding',
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        requireEttaPermission(ctx, { guest: ['read'] })
        const guests = await guestService.getAllByWeddingId(ctx.weddingId)
        return { guests: guests ?? [] }
      },
    }),

    update_guest: tool({
      description: "Update a guest's information (name, email, phone)",
      inputSchema: zodSchema(
        z.object({
          guestId: z.number(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          email: z.string().nullable().optional(),
          phone: z.string().nullable().optional(),
        })
      ),
      execute: async ({ guestId, ...data }) => {
        const authz = requirePlannerAuthz(ctx)
        const guest = await guestService.updateGuest(authz, ctx.weddingId, guestId, data)
        return { guest }
      },
    }),

    get_rsvp_summary: tool({
      description: 'Get RSVP statistics for the wedding',
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        requireEttaPermission(ctx, { rsvp: ['read_responses'] })
        const invitations = await invitationService.getAllByWeddingId(ctx.weddingId)
        const list = invitations ?? []

        const attending = list.filter((i) => i.rsvp === RSVP_STATUS.ATTENDING).length
        const declined = list.filter((i) => i.rsvp === RSVP_STATUS.DECLINED).length
        const pending = list.length - attending - declined

        return { total: list.length, attending, declined, pending }
      },
    }),

    get_guest_event_attendance: tool({
      description:
        'Look up which wedding events a specific guest is invited to or attending, including RSVP status',
      inputSchema: zodSchema(
        z.object({
          guestQuery: z.string().min(1),
        })
      ),
      execute: async ({ guestQuery }) => {
        requireEttaPermission(ctx, { rsvp: ['read_responses'] })
        const [guests, invitations, events] = await Promise.all([
          guestService.getAllByWeddingId(ctx.weddingId),
          invitationService.getAllByWeddingId(ctx.weddingId),
          eventService.getWeddingEvents(ctx.weddingId),
        ])

        const normalizedQuery = normalizeSearchValue(guestQuery)
        const matchedGuest = (guests ?? []).find((guest) =>
          buildGuestSearchIndex(guest).some((value) => value.includes(normalizedQuery))
        )

        if (!matchedGuest) {
          return {
            guest: null,
            attendance: [],
            message: `No guest found matching "${guestQuery}".`,
          }
        }

        const eventNameById = new Map((events ?? []).map((event) => [event.id, event.name]))
        const attendance = (invitations ?? [])
          .filter((invitation) => invitation.guestId === matchedGuest.id)
          .map((invitation) => ({
            eventId: invitation.eventId,
            eventName: eventNameById.get(invitation.eventId) ?? invitation.eventId,
            rsvp: invitation.rsvp,
          }))
          .sort((a, b) => a.eventName.localeCompare(b.eventName))

        return {
          guest: {
            id: matchedGuest.id,
            name: buildGuestName(matchedGuest),
            email: matchedGuest.email ?? null,
            householdId: matchedGuest.householdId ?? null,
          },
          attendance,
        }
      },
    }),

    list_event_attendance: tool({
      description:
        'List guests for a specific event, optionally filtered by RSVP status such as attending or declined',
      inputSchema: zodSchema(
        z.object({
          eventQuery: z.string().min(1),
          rsvpFilter: rsvpFilterSchema.optional(),
        })
      ),
      execute: async ({ eventQuery, rsvpFilter }) => {
        requireEttaPermission(ctx, { rsvp: ['read_responses'] })
        const [guests, invitations, events] = await Promise.all([
          guestService.getAllByWeddingId(ctx.weddingId),
          invitationService.getAllByWeddingId(ctx.weddingId),
          eventService.getWeddingEvents(ctx.weddingId),
        ])

        const normalizedQuery = normalizeSearchValue(eventQuery)
        const matchedEvent = (events ?? []).find((event) => {
          const values = [event.name, event.id].map(normalizeSearchValue).filter(Boolean)
          return values.some((value) => value.includes(normalizedQuery))
        })

        if (!matchedEvent) {
          return {
            event: null,
            guests: [],
            message: `No event found matching "${eventQuery}".`,
          }
        }

        const guestById = new Map((guests ?? []).map((guest) => [guest.id, guest]))
        const eventGuests = (invitations ?? [])
          .filter((invitation) => invitation.eventId === matchedEvent.id)
          .filter((invitation) => (rsvpFilter ? invitation.rsvp === rsvpFilter : true))
          .map((invitation) => {
            const guest = guestById.get(invitation.guestId)
            return {
              guestId: invitation.guestId,
              name: guest ? buildGuestName(guest) : `Guest ${invitation.guestId}`,
              email: guest?.email ?? null,
              rsvp: invitation.rsvp,
            }
          })
          .sort((a, b) => {
            if (a.rsvp === b.rsvp) return a.name.localeCompare(b.name)
            return a.rsvp.localeCompare(b.rsvp)
          })

        return {
          event: {
            id: matchedEvent.id,
            name: matchedEvent.name,
          },
          guests: eventGuests,
        }
      },
    }),
  }
}
