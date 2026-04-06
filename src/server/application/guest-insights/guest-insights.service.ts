import { TRPCError } from '@trpc/server'
import { RSVP_STATUS } from '~/lib/constants/rsvp'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { EventService } from '~/server/domains/event/event.service'
import type { GuestService } from '~/server/domains/guest/guest.service'
import type { Guest, GuestWithInvitations } from '~/server/domains/guest/guest.types'
import type { InvitationService } from '~/server/domains/invitation/invitation.service'
import type { Invitation } from '~/server/domains/invitation/invitation.types'

const normalizeSearchValue = (value: string | null | undefined): string =>
  (value ?? '').trim().toLowerCase()

const buildGuestSearchIndex = (guest: {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  householdId?: string | null
}): string[] =>
  [
    guest.firstName,
    guest.lastName,
    `${guest.firstName ?? ''} ${guest.lastName ?? ''}`.trim(),
    guest.email,
    guest.householdId,
  ]
    .map(normalizeSearchValue)
    .filter(Boolean)

const buildGuestName = (guest: { firstName?: string | null; lastName?: string | null }): string =>
  [guest.firstName, guest.lastName].filter(Boolean).join(' ').trim()

export class GuestInsightsService {
  constructor(
    private guestService: Pick<GuestService, 'getAllByHouseholdId' | 'getAllByWeddingId'>,
    private invitationService: Pick<
      InvitationService,
      'getAllByWeddingId' | 'getByEventIdInWedding'
    >,
    private eventService: Pick<EventService, 'getWeddingEvents'>
  ) {}

  async listEventInvitations(
    authz: AuthzContext,
    weddingId: string,
    eventId: string
  ): Promise<Invitation[]> {
    requirePermission(authz, { guest_invitation: ['read'] })
    return this.invitationService.getByEventIdInWedding(eventId, weddingId)
  }

  async listHouseholdGuests(
    authz: AuthzContext,
    weddingId: string,
    householdId: string
  ): Promise<{ id: string; guests: GuestWithInvitations[] }> {
    requirePermission(authz, { guest: ['read'] })
    const guests = await this.guestService.getAllByHouseholdId(householdId)
    const inScope = guests.every((guest) => guest.weddingId === weddingId)
    if (!inScope) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this household',
      })
    }
    return { id: householdId, guests }
  }

  async listGuests(authz: AuthzContext, weddingId: string): Promise<Guest[]> {
    requirePermission(authz, { guest: ['read'] })
    const guests = await this.guestService.getAllByWeddingId(weddingId)
    return guests ?? []
  }

  async getRsvpSummary(
    authz: AuthzContext,
    weddingId: string
  ): Promise<{ attending: number; declined: number; pending: number; total: number }> {
    requirePermission(authz, { rsvp: ['read_responses'] })
    const invitations = await this.invitationService.getAllByWeddingId(weddingId)
    const list = invitations ?? []
    const attending = list.filter((i) => i.rsvp === RSVP_STATUS.ATTENDING).length
    const declined = list.filter((i) => i.rsvp === RSVP_STATUS.DECLINED).length
    const pending = list.length - attending - declined
    return { total: list.length, attending, declined, pending }
  }

  async getGuestEventAttendance(
    authz: AuthzContext,
    weddingId: string,
    guestQuery: string
  ): Promise<{
    attendance: Array<{ eventId: string; eventName: string; rsvp: string }>
    guest: { email: string | null; householdId: string | null; id: number; name: string } | null
    message?: string
  }> {
    requirePermission(authz, { rsvp: ['read_responses'] })
    const [guests, invitations, events] = await Promise.all([
      this.guestService.getAllByWeddingId(weddingId),
      this.invitationService.getAllByWeddingId(weddingId),
      this.eventService.getWeddingEvents(weddingId),
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
  }

  async listEventAttendance(
    authz: AuthzContext,
    weddingId: string,
    eventQuery: string,
    rsvpFilter?: string
  ): Promise<{
    event: { id: string; name: string } | null
    guests: Array<{ email: string | null; guestId: number; name: string; rsvp: string }>
    message?: string
  }> {
    requirePermission(authz, { rsvp: ['read_responses'] })
    const [guests, invitations, events] = await Promise.all([
      this.guestService.getAllByWeddingId(weddingId),
      this.invitationService.getAllByWeddingId(weddingId),
      this.eventService.getWeddingEvents(weddingId),
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
  }
}
