/**
 * Household Invite - Repository
 *
 * Read model and writes for the public save-the-date flow. The queries span
 * household, guest, website and wedding tables, shaped for this one flow, so
 * they live beside the application service rather than in a domain repository.
 * Accepts a transaction client so updates can run in a unit of work.
 */

import { Prisma, type PrismaClient } from '@prisma/client'

import { rsvpHouseholdSelect } from '~/server/domains/household/household.repository'
import type { HouseholdSearchResult } from '~/server/domains/household/household.types'
import { WebsiteSectionType } from '~/server/domains/website-section/website-section.types'

type DbClient = PrismaClient | Prisma.TransactionClient

// The primary wedding date and venue live on the event named "Wedding Day"
// (see website-management.service.ts), not on the Wedding record itself.
export const WEDDING_DAY_EVENT_NAME = 'Wedding Day'

export const isUniqueConstraintError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'

export class HouseholdInviteRepository {
  constructor(private db: DbClient) {}

  async findHouseholdForInviteLink(householdId: string, weddingId: string) {
    return this.db.household.findFirst({
      where: { id: householdId, weddingId },
      select: {
        id: true,
        weddingId: true,
        guests: {
          orderBy: { id: 'asc' },
          take: 1,
          select: { firstName: true, lastName: true },
        },
      },
    })
  }

  async findWebsiteSubUrlByWeddingId(weddingId: string) {
    return this.db.website.findFirst({
      where: { weddingId },
      select: { subUrl: true },
    })
  }

  /**
   * Store the household's invite code. Returns false when the code collides
   * with another household's (unique constraint), so the caller can retry.
   */
  async trySetInviteCode(householdId: string, code: string, expiresAt: Date): Promise<boolean> {
    try {
      await this.db.household.update({
        where: { id: householdId },
        data: { inviteCode: code, inviteCodeExpiresAt: expiresAt },
      })
      return true
    } catch (error) {
      if (isUniqueConstraintError(error)) return false
      throw error
    }
  }

  async findWeddingSummaryBySubUrl(subUrl: string) {
    return this.db.website.findFirst({
      where: { subUrl },
      select: {
        wedding: {
          select: {
            groomFirstName: true,
            brideFirstName: true,
            events: {
              where: { name: WEDDING_DAY_EVENT_NAME },
              orderBy: { date: 'asc' },
              take: 1,
              select: { date: true, venue: true },
            },
          },
        },
      },
    })
  }

  async findRsvpHousehold(
    householdId: string,
    weddingId: string
  ): Promise<HouseholdSearchResult | null> {
    return this.db.household.findFirst({
      where: { id: householdId, weddingId },
      select: rsvpHouseholdSelect,
    })
  }

  async findHouseholdByInviteCode(code: string) {
    return this.db.household.findFirst({
      where: { inviteCode: code },
      select: { id: true, weddingId: true, inviteCodeExpiresAt: true },
    })
  }

  async findWeddingIdBySubUrl(subUrl: string) {
    return this.db.website.findFirst({
      where: { subUrl },
      select: { weddingId: true },
    })
  }

  async findHouseholdInviteDetails(householdId: string, weddingId: string) {
    return this.db.household.findFirst({
      where: { id: householdId, weddingId },
      select: {
        id: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        wedding: {
          select: {
            groomFirstName: true,
            groomLastName: true,
            brideFirstName: true,
            brideLastName: true,
            events: {
              orderBy: { date: 'asc' },
              select: { name: true, date: true, venue: true },
            },
          },
        },
        guests: {
          orderBy: { id: 'asc' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isTagAlong: true,
          },
        },
      },
    })
  }

  /** Template and Save the Date copy, so the invite card mirrors the website. */
  async findWebsiteInviteTheme(weddingId: string) {
    return this.db.website.findFirst({
      where: { weddingId },
      select: {
        templateId: true,
        websiteSections: {
          where: { type: WebsiteSectionType.SAVE_THE_DATE },
          select: { isEnabled: true, content: true },
        },
      },
    })
  }

  /** Whether another guest in the wedding already uses one of these emails. */
  async emailTakenByOtherGuest(
    weddingId: string,
    emails: string[],
    excludeGuestIds: number[]
  ): Promise<boolean> {
    const existingGuest = await this.db.guest.findFirst({
      where: {
        weddingId,
        email: { in: emails },
        id: { notIn: excludeGuestIds },
      },
      select: { id: true },
    })
    return existingGuest !== null
  }

  /** Returns the number of rows updated (1 when the household is in scope). */
  async updateHouseholdAddress(
    householdId: string,
    weddingId: string,
    data: {
      address1: string | null
      address2: string | null
      city: string | null
      state: string | null
      zipCode: string | null
      country: string | null
    }
  ): Promise<number> {
    const result = await this.db.household.updateMany({
      where: { id: householdId, weddingId },
      data,
    })
    return result.count
  }

  /** Returns the number of rows updated (1 when the guest is in scope). */
  async updateGuestDetails(
    guestId: number,
    scope: { householdId: string; weddingId: string },
    data: { firstName: string; lastName: string; email: string | null; phone: string | null }
  ): Promise<number> {
    const result = await this.db.guest.updateMany({
      where: { id: guestId, householdId: scope.householdId, weddingId: scope.weddingId },
      data,
    })
    return result.count
  }
}
