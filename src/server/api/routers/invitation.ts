import { z } from 'zod'

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'

export const invitationRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        guestId: z.number(),
        eventId: z.string(),
        rsvp: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.auth.userId
      const { guestId, eventId, rsvp } = input

      return await ctx.db.invitation.create({
        data: {
          guestId,
          eventId,
          rsvp,
          userId,
        },
      })
    }),

  update: protectedProcedure
    .input(
      z.object({
        guestId: z.number(),
        eventId: z.string(),
        rsvp: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.invitation.update({
        where: {
          invitationId: {
            guestId: input.guestId,
            eventId: input.eventId,
          },
        },
        data: {
          rsvp: input.rsvp,
        },
      })
    }),

  getAllByUserId: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.userId) return
    return await ctx.db.invitation.findMany({
      where: {
        userId: ctx.auth.userId,
      },
    })
  }),
})
