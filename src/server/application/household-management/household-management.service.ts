/**
 * Household Management Application Service
 *
 * Orchestrates complex household operations that span multiple domains:
 * - Household domain (core household data)
 * - Guest domain (guest creation/updates)
 * - Invitation domain (invitation creation/updates)
 * - Gift domain (gift tracking)
 */

import type {
  CreateHouseholdResult,
  CreateHouseholdWithGuestsInput,
  UpdateHouseholdResult,
  UpdateHouseholdWithGuestsInput,
} from '~/server/application/household-management/household-management.types'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { EventRepository } from '~/server/domains/event/event.repository'
import type { GiftRepository } from '~/server/domains/gift/gift.repository'
import type { GuestRepository } from '~/server/domains/guest/guest.repository'
import type { HouseholdRepository } from '~/server/domains/household/household.repository'
import type { Household, HouseholdSearchResult } from '~/server/domains/household/household.types'
import type { InvitationRepository } from '~/server/domains/invitation/invitation.repository'
import { RSVP_STATUS } from '~/server/domains/invitation/rsvp-status'
import {
  ForbiddenError,
  InvariantViolationError,
  NotFoundError,
} from '~/server/domains/shared/domain-error'
import type { WebsiteRepository } from '~/server/domains/website/website.repository'
import type { UnitOfWork } from '~/server/infrastructure/database/unit-of-work'

export type HouseholdManagementRepos = {
  household: HouseholdRepository
  guest: GuestRepository
  invitation: InvitationRepository
  gift: GiftRepository
  event: EventRepository
}

export class HouseholdManagementService {
  constructor(
    private householdRepo: HouseholdRepository,
    private guestRepo: GuestRepository,
    private invitationRepo: InvitationRepository,
    _giftRepo: GiftRepository,
    private websiteRepo: WebsiteRepository,
    private unitOfWork: UnitOfWork<HouseholdManagementRepos>
  ) {}

  async createHouseholdWithGuests(
    ctx: AuthzContext,
    weddingId: string,
    data: CreateHouseholdWithGuestsInput
  ): Promise<CreateHouseholdResult> {
    requirePermission(ctx, { guest: ['create'] })
    await this.assertEventIdsInWeddingScope(
      data.guestParty.flatMap((guest) => Object.keys(guest.invites)),
      weddingId
    )

    return this.unitOfWork(async (repos) => {
      const txHouseholdRepo = repos.household
      const txGuestRepo = repos.guest

      let defaultEventIds: string[] | undefined
      const getDefaultEventIds = async () => {
        defaultEventIds ??= await repos.event.findIdsByWeddingId(weddingId)
        return defaultEventIds
      }

      const eventIds = Object.keys(data.guestParty[0]?.invites ?? {})

      const household = await txHouseholdRepo.createWithGifts(
        {
          weddingId,
          address1: data.address1,
          address2: data.address2,
          city: data.city,
          state: data.state,
          country: data.country,
          zipCode: data.zipCode,
          likelihoodOfAttending: data.likelihoodOfAttending,
          notes: data.notes,
        },
        eventIds
      )

      if (!household) {
        throw new InvariantViolationError('Failed to create household')
      }

      const guests = await Promise.all(
        data.guestParty.map(async (guest, index) => {
          const isTagAlong = guest.isTagAlong ?? false
          const inviteEntries = Object.entries(guest.invites)
          const defaultInviteEntries =
            inviteEntries.length === 0
              ? (await getDefaultEventIds()).map(
                  (eventId) => [eventId, RSVP_STATUS.NOT_INVITED] as const
                )
              : inviteEntries
          const invitations = defaultInviteEntries.map(([eventId, rsvp]) => ({
            eventId,
            rsvp,
            weddingId,
          }))

          const createdGuest = await txGuestRepo.create({
            firstName: guest.firstName,
            lastName: guest.lastName,
            email: guest.email ?? null,
            phone: guest.phone ?? null,
            weddingId,
            householdId: household.id,
            isPrimaryContact: isTagAlong ? false : (guest.isPrimaryContact ?? index === 0),
            ageGroup: guest.ageGroup ?? null,
            isTagAlong,
            invitations,
            tagIds: guest.tagIds ?? [],
          })

          const guestWithTags = await txGuestRepo.findByIdWithInvitations(createdGuest.id)

          if (!guestWithTags) {
            throw new InvariantViolationError('Failed to refetch guest after creation')
          }

          return guestWithTags
        })
      )

      if (!guests.length) {
        throw new InvariantViolationError('Failed to create guests')
      }

      return {
        household,
        guests,
      }
    })
  }

  async updateHouseholdWithGuests(
    ctx: AuthzContext,
    weddingId: string,
    data: UpdateHouseholdWithGuestsInput
  ): Promise<UpdateHouseholdResult> {
    requirePermission(ctx, { guest: ['update'] })
    await this.assertHouseholdInWeddingScope(data.householdId, weddingId)
    await this.assertGuestIdsInWeddingScope(
      data.guestParty.flatMap((guest) => (guest.guestId ? [guest.guestId] : [])),
      weddingId
    )
    await this.assertGuestIdsInWeddingScope(data.deletedGuests ?? [], weddingId)
    await this.assertEventIdsInWeddingScope(
      [
        ...data.guestParty.flatMap((guest) => Object.keys(guest.invites)),
        ...data.gifts.map((gift) => gift.eventId),
      ],
      weddingId
    )

    return this.unitOfWork(async (repos) => {
      const txHouseholdRepo = repos.household
      const txGuestRepo = repos.guest
      const txInvitationRepo = repos.invitation
      const txGiftRepo = repos.gift
      let defaultEventIds: string[] | undefined
      const getDefaultEventIds = async () => {
        defaultEventIds ??= await repos.event.findIdsByWeddingId(weddingId)
        return defaultEventIds
      }

      const updatedHousehold = await txHouseholdRepo.update(data.householdId, {
        address1: data.address1 ?? undefined,
        address2: data.address2 ?? undefined,
        city: data.city ?? undefined,
        state: data.state ?? undefined,
        country: data.country ?? undefined,
        zipCode: data.zipCode ?? undefined,
        likelihoodOfAttending: data.likelihoodOfAttending ?? undefined,
        notes: data.notes ?? undefined,
      })

      if (data.deletedGuests && data.deletedGuests.length > 0) {
        await txGuestRepo.deleteMany(data.deletedGuests)
      }

      await txGuestRepo.clearPrimaryContactsByHousehold(data.householdId)

      const updatedGuests = await Promise.all(
        data.guestParty.map(async (guest) => {
          const isTagAlong = guest.isTagAlong ?? false
          const inviteEntries = Object.entries(guest.invites)
          const defaultInviteEntries =
            !guest.guestId && inviteEntries.length === 0
              ? (await getDefaultEventIds()).map(
                  (eventId) => [eventId, RSVP_STATUS.NOT_INVITED] as const
                )
              : inviteEntries
          const invitations = defaultInviteEntries.map(([eventId, rsvp]) => ({
            eventId,
            rsvp,
            weddingId,
          }))

          const updatedGuest = await txGuestRepo.upsert(
            guest.guestId,
            {
              firstName: guest.firstName,
              lastName: guest.lastName,
              email: guest.email ?? null,
              phone: guest.phone ?? null,
              householdId: data.householdId,
              weddingId,
              isPrimaryContact: isTagAlong ? false : (guest.isPrimaryContact ?? false),
              ageGroup: guest.ageGroup ?? null,
              isTagAlong,
            },
            invitations
          )

          if (isTagAlong && guest.guestId) {
            const allowedEventIds = Object.keys(guest.invites)
            if (allowedEventIds.length > 0) {
              await txInvitationRepo.deleteByGuestExcludingEvents(guest.guestId, allowedEventIds)
            } else {
              await txInvitationRepo.deleteByGuest(guest.guestId)
            }
          }

          if (guest.tagIds !== undefined) {
            await txGuestRepo.updateTags(updatedGuest.id, guest.tagIds)
          }

          if (guest.guestId) {
            await Promise.all(
              Object.entries(guest.invites).map(([inviteEventId, inputRsvp]) =>
                txInvitationRepo.update(guest.guestId ?? updatedGuest.id, inviteEventId, {
                  rsvp: inputRsvp,
                })
              )
            )
          }

          const guestWithTags = await txGuestRepo.findByIdWithInvitations(updatedGuest.id)

          if (!guestWithTags) {
            throw new InvariantViolationError('Failed to refetch guest after update')
          }

          return guestWithTags
        })
      )

      if (!updatedHousehold || !updatedGuests) {
        throw new InvariantViolationError('Failed to update guests')
      }

      const updatedGifts = await Promise.all(
        data.gifts.map(async (gift) => {
          return txGiftRepo.upsert({
            householdId: data.householdId,
            eventId: gift.eventId,
            description: gift.description,
            thankyou: gift.thankyou ?? false,
          })
        })
      )

      return {
        household: updatedHousehold,
        guests: updatedGuests,
        gifts: updatedGifts,
      }
    })
  }

  async deleteHousehold(
    ctx: AuthzContext,
    householdId: string,
    weddingId: string
  ): Promise<string> {
    requirePermission(ctx, { guest: ['delete'] })
    await this.assertHouseholdInWeddingScope(householdId, weddingId)

    const deletedHousehold = await this.householdRepo.delete(householdId)
    return deletedHousehold.id
  }

  async bulkCreateHouseholds(
    ctx: AuthzContext,
    weddingId: string,
    households: Parameters<HouseholdManagementService['createHouseholdWithGuests']>[2][]
  ): Promise<{ created: number; failed: number }> {
    requirePermission(ctx, { guest: ['import'] })

    // Reject out-of-scope events for the whole batch before saving anything;
    // the per-household check alone would abort after earlier households committed.
    await this.assertEventIdsInWeddingScope(
      households.flatMap((household) =>
        household.guestParty.flatMap((guest) => Object.keys(guest.invites))
      ),
      weddingId
    )

    let created = 0
    let failed = 0
    for (const household of households) {
      try {
        await this.createHouseholdWithGuests(ctx, weddingId, household)
        created++
      } catch (error) {
        if (error instanceof ForbiddenError) {
          throw error
        }
        failed++
      }
    }
    return { created, failed }
  }

  async searchHouseholds(
    ctx: AuthzContext,
    weddingId: string,
    searchText: string
  ): Promise<HouseholdSearchResult[]> {
    requirePermission(ctx, { guest: ['read'] })
    return this.householdRepo.search(searchText, weddingId)
  }

  /**
   * Search households for the public guest-facing RSVP flow.
   *
   * The guest is unauthenticated, so the search is scoped to the wedding that
   * owns the given website subUrl rather than to an active wedding session.
   */
  async searchHouseholdsPublic(
    subUrl: string,
    searchText: string
  ): Promise<HouseholdSearchResult[]> {
    const website = await this.websiteRepo.findBySubUrl(subUrl)

    if (!website?.isRsvpEnabled) {
      throw new NotFoundError('RSVP is not available for this wedding')
    }

    return this.householdRepo.searchPublicByName(searchText, website.weddingId)
  }

  /**
   * Update only the mailing address fields of a household
   */
  async updateHouseholdAddress(
    ctx: AuthzContext,
    weddingId: string,
    householdId: string,
    data: {
      address1?: string | null
      address2?: string | null
      city?: string | null
      state?: string | null
      country?: string | null
      zipCode?: string | null
    }
  ): Promise<Household> {
    requirePermission(ctx, { guest: ['update'] })
    await this.assertHouseholdInWeddingScope(householdId, weddingId)
    return this.householdRepo.update(householdId, data)
  }

  private async assertHouseholdInWeddingScope(
    householdId: string,
    weddingId: string
  ): Promise<void> {
    const belongsToWedding = await this.householdRepo.belongsToWedding(householdId, weddingId)

    if (!belongsToWedding) {
      throw new ForbiddenError('You do not have permission to modify this household')
    }
  }

  private async assertGuestIdsInWeddingScope(guestIds: number[], weddingId: string): Promise<void> {
    const uniqueGuestIds = [...new Set(guestIds)]
    for (const guestId of uniqueGuestIds) {
      const belongsToWedding = await this.guestRepo.belongsToWedding(guestId, weddingId)
      if (!belongsToWedding) {
        throw new ForbiddenError(`Guest ${guestId} is outside the requested wedding scope`)
      }
    }
  }

  private async assertEventIdsInWeddingScope(eventIds: string[], weddingId: string): Promise<void> {
    const uniqueEventIds = [...new Set(eventIds)]
    for (const eventId of uniqueEventIds) {
      const belongsToWedding = await this.invitationRepo.eventBelongsToWedding(eventId, weddingId)
      if (!belongsToWedding) {
        throw new ForbiddenError(`Event ${eventId} is outside the requested wedding scope`)
      }
    }
  }
}
