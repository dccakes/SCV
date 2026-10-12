import { Prisma } from '@prisma/client'
import { tool, zodSchema } from 'ai'
import { z } from 'zod'

import { env } from '~/env'
import type { EttaContext } from '~/lib/etta/types'
import { createHouseholdInviteCode } from '~/server/application/household-invite/household-invite-code'
import { db } from '~/server/db'

const INVITE_CODE_TTL_MS = 365 * 24 * 60 * 60 * 1000

const isUniqueConstraintError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'

/**
 * Assigns (or refreshes) the household's short invite code, retrying on the
 * rare collision with another household — mirrors
 * HouseholdInviteService.assignInviteCode, which owns the couple-facing flow.
 */
async function assignInviteCode(
  householdId: string,
  guests: Array<{ firstName: string; lastName: string | null }>
): Promise<string> {
  const expiresAt = new Date(Date.now() + INVITE_CODE_TTL_MS)
  const maxAttempts = 5
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = createHouseholdInviteCode(guests)
    try {
      await db.household.update({
        where: { id: householdId },
        data: { inviteCode: code, inviteCodeExpiresAt: expiresAt },
      })
      return code
    } catch (error) {
      if (isUniqueConstraintError(error) && attempt < maxAttempts - 1) continue
      throw error
    }
  }
  throw new Error('Could not generate a unique invite code')
}

async function findGuestHousehold(guestId: number) {
  const guest = await db.guest.findUnique({
    where: { id: guestId },
    select: { householdId: true },
  })
  if (!guest) {
    throw new Error('Guest not found')
  }
  return guest.householdId
}

export function getConciergeTools(ctx: EttaContext) {
  return {
    get_public_info: tool({
      description: 'Returns public wedding info visible to guests',
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        const events = await db.event.findMany({
          where: { weddingId: ctx.weddingId },
          select: { name: true, date: true, startTime: true, venue: true },
        })
        return { couple: ctx.wedding, events }
      },
    }),

    get_faq: tool({
      description: 'Returns published FAQs for the wedding',
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        return db.faq.findMany({
          where: { weddingId: ctx.weddingId, published: true },
          select: { question: true, answer: true },
        })
      },
    }),

    submit_rsvp: tool({
      description: 'Submits RSVP for the current guest',
      inputSchema: zodSchema(
        z.object({
          eventId: z.string(),
          rsvp: z.enum(['Attending', 'Declined']),
        })
      ),
      execute: async ({ eventId, rsvp }) => {
        if (!ctx.guestId) {
          throw new Error('Guest context required')
        }
        // Guest RSVP bypasses AuthzContext — authenticated via JWT token
        await db.invitation.updateMany({
          where: { guestId: ctx.guestId, eventId },
          data: { rsvp },
        })
        return { message: 'RSVP submitted successfully' }
      },
    }),

    get_my_household: tool({
      description:
        "Returns the current guest's household: its members and each member's RSVP status per event",
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        if (!ctx.guestId) {
          throw new Error('Guest context required')
        }
        const householdId = await findGuestHousehold(ctx.guestId)
        const household = await db.household.findUnique({
          where: { id: householdId },
          select: {
            id: true,
            guests: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                isPrimaryContact: true,
                invitations: {
                  select: { eventId: true, rsvp: true, event: { select: { name: true } } },
                },
              },
              orderBy: { id: 'asc' },
            },
          },
        })
        if (!household) {
          throw new Error('Household not found')
        }
        return {
          householdId: household.id,
          members: household.guests.map((guest) => ({
            firstName: guest.firstName,
            lastName: guest.lastName,
            isPrimaryContact: guest.isPrimaryContact,
            rsvps: guest.invitations.map((inv) => ({ event: inv.event.name, rsvp: inv.rsvp })),
          })),
        }
      },
    }),

    get_invite_link: tool({
      description:
        "Returns the household's personal invite link (save-the-date page) where they can view " +
        'details and confirm their contact info. Generates a fresh code if none exists.',
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        if (!ctx.guestId) {
          throw new Error('Guest context required')
        }
        const householdId = await findGuestHousehold(ctx.guestId)
        const [household, website] = await Promise.all([
          db.household.findUnique({
            where: { id: householdId },
            select: {
              id: true,
              weddingId: true,
              inviteCode: true,
              inviteCodeExpiresAt: true,
              guests: {
                orderBy: { id: 'asc' },
                take: 1,
                select: { firstName: true, lastName: true },
              },
            },
          }),
          db.website.findFirst({
            where: { weddingId: ctx.weddingId },
            select: { subUrl: true },
          }),
        ])
        if (!household || household.weddingId !== ctx.weddingId) {
          throw new Error('Household not found')
        }
        if (!website) {
          return {
            status: 'unavailable',
            message:
              "The couple hasn't published their wedding website yet, so there's no invite link " +
              'to share. Check back soon!',
          }
        }

        const expired =
          !household.inviteCodeExpiresAt || household.inviteCodeExpiresAt.getTime() <= Date.now()
        let code = household.inviteCode
        if (!code || expired) {
          code = await assignInviteCode(household.id, household.guests)
        }

        const base = env.NEXT_PUBLIC_APP_URL
        const path = `/w/${website.subUrl}/save-the-date/${code}`
        return { url: base ? `${new URL(base).origin}${path}` : path }
      },
    }),

    flag_question: tool({
      description: 'Flags a question for the couple to answer',
      inputSchema: zodSchema(
        z.object({
          question: z.string(),
          context: z.string().optional(),
        })
      ),
      execute: async ({ question, context }) => {
        if (!ctx.guestId) {
          throw new Error('Guest context required')
        }
        await db.guestQuestion.create({
          data: {
            weddingId: ctx.weddingId,
            guestId: ctx.guestId,
            question,
            context,
          },
        })
        return { message: 'Question flagged for the couple to answer' }
      },
    }),
  }
}
