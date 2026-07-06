// biome-ignore lint/style/noRestrictedImports: Application service owns a cross-domain public flow.
import { Prisma, type PrismaClient } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { createHouseholdInviteCode } from '~/server/application/household-invite/household-invite-code'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import {
  type SaveTheDateSectionContent,
  WebsiteSectionType,
} from '~/server/domains/website-section/website-section.types'
import { saveTheDateSectionContentSchema } from '~/server/domains/website-section/website-section.validator'

type HouseholdInviteDb = Pick<PrismaClient, 'household' | 'website' | 'guest' | '$transaction'>

export type HouseholdInviteGuestInput = {
  guestId: number
  firstName: string
  lastName: string | null
  email: string | null
  phone: string | null
}

export type UpdateHouseholdInviteInput = {
  address1: string | null
  address2: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  country: string | null
  guests: HouseholdInviteGuestInput[]
}

// The primary wedding date and venue live on the event named "Wedding Day"
// (see website-management.service.ts), not on the Wedding record itself.
const WEDDING_DAY_EVENT_NAME = 'Wedding Day'

export type HouseholdInviteData = {
  weddingId: string
  expiresAt: Date
  /**
   * The wedding website template the couple selected. The invite card themes
   * itself with this so it matches the public Save the Date / Invitation pages.
   */
  templateId: string | null
  /**
   * The couple's editable Save the Date copy (when that section is enabled), so
   * the same customisation shown on the website surfaces flows into the invite.
   */
  saveTheDate?: SaveTheDateSectionContent
  wedding: {
    groomFirstName: string
    groomLastName: string
    brideFirstName: string
    brideLastName: string
    date: Date | null
    venue: string | null
  }
  /** Wedding events, used to build the "save the date" calendar block. */
  events: Array<{
    name: string
    date: Date | null
    venue: string | null
  }>
  household: {
    id: string
    address1: string | null
    address2: string | null
    city: string | null
    state: string | null
    zipCode: string | null
    country: string | null
  }
  guests: Array<{
    id: number
    firstName: string
    lastName: string
    email: string | null
    phone: string | null
    /** Travels with the household but isn't formally invited to the ceremony or dinner reception. */
    isTagAlong: boolean
  }>
}

const optionalTextSchema = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .nullable()

const optionalEmailSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
  z
    .string()
    .email()
    .or(z.literal('').transform(() => null))
    .nullable()
)

const normalizeOptionalText = (value: string | null) => optionalTextSchema.parse(value)

const normalizeUpdateInput = (input: UpdateHouseholdInviteInput): UpdateHouseholdInviteInput => {
  const guests = input.guests.map((guest) => {
    if (!Number.isInteger(guest.guestId) || guest.guestId <= 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Guest details could not be matched to this household',
      })
    }

    const firstName = guest.firstName.trim()
    if (!firstName) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Each household member needs a first name',
      })
    }

    return {
      guestId: guest.guestId,
      firstName,
      lastName: normalizeOptionalText(guest.lastName) ?? '',
      email: optionalEmailSchema.parse(guest.email),
      phone: normalizeOptionalText(guest.phone),
    }
  })

  const emails = guests
    .map((guest) => guest.email)
    .filter((email): email is string => Boolean(email))
  if (new Set(emails).size !== emails.length) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Each email address can only be used once for this wedding',
    })
  }

  return {
    address1: normalizeOptionalText(input.address1),
    address2: normalizeOptionalText(input.address2),
    city: normalizeOptionalText(input.city),
    state: normalizeOptionalText(input.state),
    zipCode: normalizeOptionalText(input.zipCode),
    country: normalizeOptionalText(input.country),
    guests,
  }
}

const normalizeBaseUrl = (baseUrl: string) => {
  try {
    const parsed = new URL(baseUrl)
    return parsed.origin
  } catch {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Unable to generate invite link for this website origin',
    })
  }
}

const isUniqueConstraintError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'

export class HouseholdInviteService {
  constructor(private db: HouseholdInviteDb) {}

  async generateInviteLink(
    ctx: AuthzContext,
    weddingId: string,
    input: { householdId: string; baseUrl: string }
  ): Promise<{ url: string; expiresAt: Date }> {
    requirePermission(ctx, { guest_invitation: ['send'] })

    const household = await this.db.household.findFirst({
      where: { id: input.householdId, weddingId },
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

    if (!household) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Household not found',
      })
    }

    const website = await this.db.website.findFirst({
      where: { weddingId },
      select: { subUrl: true },
    })

    if (!website) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Publish a wedding website before generating household invite links',
      })
    }

    const expiresAt = new Date()
    expiresAt.setUTCFullYear(expiresAt.getUTCFullYear() + 1)
    const code = await this.assignInviteCode(household.id, household.guests, expiresAt)

    return {
      url: `${normalizeBaseUrl(input.baseUrl)}/w/${website.subUrl}/save-the-date/${code}`,
      expiresAt,
    }
  }

  /**
   * Assigns a short invite code to the household, retrying on the rare
   * collision with another household's code (the DB unique constraint is the
   * source of truth). Reused links keep the same code and just get a fresh
   * expiry.
   */
  private async assignInviteCode(
    householdId: string,
    guests: Array<{ firstName: string; lastName: string | null }>,
    expiresAt: Date
  ): Promise<string> {
    const maxAttempts = 5
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const code = createHouseholdInviteCode(guests)
      try {
        await this.db.household.update({
          where: { id: householdId },
          data: { inviteCode: code, inviteCodeExpiresAt: expiresAt },
        })
        return code
      } catch (error) {
        if (isUniqueConstraintError(error) && attempt < maxAttempts - 1) continue
        throw error
      }
    }

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Could not generate a unique invite code',
    })
  }

  async getPublicWeddingSummary(subUrl: string): Promise<{
    groomFirstName: string
    brideFirstName: string
    date: Date | null
    venue: string | null
  } | null> {
    const website = await this.db.website.findFirst({
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

    if (!website) return null

    const weddingDayEvent = website.wedding.events[0]
    return {
      groomFirstName: website.wedding.groomFirstName,
      brideFirstName: website.wedding.brideFirstName,
      date: weddingDayEvent?.date ?? null,
      venue: weddingDayEvent?.venue ?? null,
    }
  }

  async getInviteData(subUrl: string, code: string | null | undefined) {
    const scopedInvite = await this.resolveInviteScope(subUrl, code)
    if (!scopedInvite) return null

    return this.loadHouseholdInviteData(
      scopedInvite.weddingId,
      scopedInvite.householdId,
      scopedInvite.expiresAt
    )
  }

  async updateHouseholdDetails(
    subUrl: string,
    code: string | null | undefined,
    input: UpdateHouseholdInviteInput
  ): Promise<{ success: true }> {
    const inviteData = await this.getInviteData(subUrl, code)
    if (!inviteData) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Invalid or expired household invite',
      })
    }

    let normalizedInput: UpdateHouseholdInviteInput
    try {
      normalizedInput = normalizeUpdateInput(input)
    } catch (error) {
      if (error instanceof TRPCError) throw error
      if (error instanceof z.ZodError) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Please enter a valid email address or leave the email field blank',
        })
      }
      throw error
    }

    const allowedGuestIds = new Set(inviteData.guests.map((guest) => guest.id))
    const hasInvalidGuest = normalizedInput.guests.some(
      (guest) => !allowedGuestIds.has(guest.guestId)
    )

    if (hasInvalidGuest) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Guest update is outside this household invite',
      })
    }

    try {
      await this.db.$transaction(async (tx) => {
        const submittedEmails = normalizedInput.guests
          .map((guest) => guest.email)
          .filter((email): email is string => Boolean(email))

        if (submittedEmails.length > 0) {
          const existingGuest = await tx.guest.findFirst({
            where: {
              weddingId: inviteData.weddingId,
              email: { in: submittedEmails },
              id: { notIn: normalizedInput.guests.map((guest) => guest.guestId) },
            },
            select: { id: true },
          })

          if (existingGuest) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Each email address can only be used once for this wedding',
            })
          }
        }

        const householdUpdate = await tx.household.updateMany({
          where: { id: inviteData.household.id, weddingId: inviteData.weddingId },
          data: {
            address1: normalizedInput.address1,
            address2: normalizedInput.address2,
            city: normalizedInput.city,
            state: normalizedInput.state,
            zipCode: normalizedInput.zipCode,
            country: normalizedInput.country,
          },
        })

        if (householdUpdate.count !== 1) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Invalid or expired household invite',
          })
        }

        await Promise.all(
          normalizedInput.guests.map(async (guest) => {
            const guestUpdate = await tx.guest.updateMany({
              where: {
                id: guest.guestId,
                householdId: inviteData.household.id,
                weddingId: inviteData.weddingId,
              },
              data: {
                firstName: guest.firstName,
                lastName: guest.lastName ?? '',
                email: guest.email,
                phone: guest.phone,
              },
            })

            if (guestUpdate.count !== 1) {
              throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Guest update is outside this household invite',
              })
            }
          })
        )
      })
    } catch (error) {
      if (error instanceof TRPCError) throw error
      if (isUniqueConstraintError(error)) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Each email address can only be used once for this wedding',
        })
      }
      throw error
    }

    return { success: true }
  }

  /**
   * Whether an invite code is currently active (unexpired) and, if so, which
   * household/wedding it's scoped to. Shared by every consumer that only
   * needs to check the code, not fully load the household's invite data.
   */
  private async findActiveHouseholdByInviteCode(code: string | null | undefined): Promise<{
    id: string
    weddingId: string
    inviteCodeExpiresAt: Date
  } | null> {
    if (!code) return null

    const household = await this.db.household.findFirst({
      where: { inviteCode: code },
      select: { id: true, weddingId: true, inviteCodeExpiresAt: true },
    })

    if (!household?.inviteCodeExpiresAt) return null
    if (household.inviteCodeExpiresAt.getTime() <= Date.now()) return null

    return {
      id: household.id,
      weddingId: household.weddingId,
      inviteCodeExpiresAt: household.inviteCodeExpiresAt,
    }
  }

  /**
   * Whether a guest's invite code is valid and scoped to this wedding, so a
   * password-protected site can be unlocked without a fresh DB lookup for the
   * household details.
   */
  async isInviteCodeValidForWedding(code: string | undefined, weddingId: string): Promise<boolean> {
    const household = await this.findActiveHouseholdByInviteCode(code)
    return household?.weddingId === weddingId
  }

  private async resolveInviteScope(subUrl: string, code: string | null | undefined) {
    const household = await this.findActiveHouseholdByInviteCode(code)
    if (!household) return null

    const website = await this.db.website.findFirst({
      where: { subUrl },
      select: { weddingId: true },
    })

    if (!website || website.weddingId !== household.weddingId) return null

    return {
      weddingId: household.weddingId,
      householdId: household.id,
      expiresAt: household.inviteCodeExpiresAt,
    }
  }

  private async loadHouseholdInviteData(
    weddingId: string,
    householdId: string,
    expiresAt: Date
  ): Promise<HouseholdInviteData | null> {
    const [household, website] = await Promise.all([
      this.db.household.findFirst({
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
      }),
      // The selected template and Save the Date copy live on the website; load
      // them so the invite card mirrors the public Save the Date / Invitation
      // surfaces instead of falling back to the app's default look.
      this.db.website.findFirst({
        where: { weddingId },
        select: {
          templateId: true,
          websiteSections: {
            where: { type: WebsiteSectionType.SAVE_THE_DATE },
            select: { isEnabled: true, content: true },
          },
        },
      }),
    ])

    if (!household) return null

    const { events, ...weddingNames } = household.wedding
    // The primary date/venue come from the "Wedding Day" event; the full event
    // list drives the save-the-date calendar block.
    const weddingDayEvent = events.find((event) => event.name === WEDDING_DAY_EVENT_NAME)

    // Mirror the website surfaces: only enabled Save the Date copy overrides the
    // template defaults, and malformed stored content is ignored rather than thrown.
    const saveTheDateSection = website?.websiteSections?.[0]
    const parsedSaveTheDate = saveTheDateSection?.isEnabled
      ? saveTheDateSectionContentSchema.safeParse(saveTheDateSection.content)
      : undefined
    const saveTheDate = parsedSaveTheDate?.success ? parsedSaveTheDate.data : undefined

    return {
      weddingId,
      expiresAt,
      templateId: website?.templateId ?? null,
      saveTheDate,
      wedding: {
        ...weddingNames,
        date: weddingDayEvent?.date ?? null,
        venue: weddingDayEvent?.venue ?? null,
      },
      events,
      household: {
        id: household.id,
        address1: household.address1,
        address2: household.address2,
        city: household.city,
        state: household.state,
        zipCode: household.zipCode,
        country: household.country,
      },
      guests: household.guests,
    }
  }
}
