// biome-ignore lint/style/noRestrictedImports: Application service owns a cross-domain public flow.
import { Prisma, type PrismaClient } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import {
  createHouseholdInviteToken,
  verifyHouseholdInviteToken,
} from '~/server/application/household-invite/household-invite-token'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'

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

export type HouseholdInviteData = {
  weddingId: string
  expiresAt: Date
  wedding: {
    groomFirstName: string
    groomLastName: string
    brideFirstName: string
    brideLastName: string
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

  createTokenForTesting(input: { weddingId: string; householdId: string }) {
    return createHouseholdInviteToken(input)
  }

  async generateInviteLink(
    ctx: AuthzContext,
    weddingId: string,
    input: { householdId: string; baseUrl: string }
  ): Promise<{ url: string; expiresAt: Date }> {
    requirePermission(ctx, { guest_invitation: ['send'] })

    const household = await this.db.household.findFirst({
      where: { id: input.householdId, weddingId },
      select: { id: true, weddingId: true },
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
    const token = createHouseholdInviteToken({
      weddingId,
      householdId: household.id,
      expiresAt,
    })

    return {
      url: `${normalizeBaseUrl(input.baseUrl)}/${website.subUrl}/invite/${token}`,
      expiresAt,
    }
  }

  async getInviteData(subUrl: string, token: string | null | undefined) {
    const scopedInvite = await this.resolveInviteScope(subUrl, token)
    if (!scopedInvite) return null

    return this.loadHouseholdInviteData(
      scopedInvite.weddingId,
      scopedInvite.householdId,
      scopedInvite.expiresAt
    )
  }

  async updateHouseholdDetails(
    subUrl: string,
    token: string | null | undefined,
    input: UpdateHouseholdInviteInput
  ): Promise<{ success: true }> {
    const inviteData = await this.getInviteData(subUrl, token)
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

  private async resolveInviteScope(subUrl: string, token: string | null | undefined) {
    const verifiedToken = verifyHouseholdInviteToken(token)
    if (!verifiedToken) return null

    const website = await this.db.website.findFirst({
      where: { subUrl },
      select: { weddingId: true },
    })

    if (!website || website.weddingId !== verifiedToken.weddingId) return null
    return verifiedToken
  }

  private async loadHouseholdInviteData(
    weddingId: string,
    householdId: string,
    expiresAt: Date
  ): Promise<HouseholdInviteData | null> {
    const household = await this.db.household.findFirst({
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
          },
        },
      },
    })

    if (!household) return null

    const { events, ...weddingNames } = household.wedding

    return {
      weddingId,
      expiresAt,
      wedding: weddingNames,
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
