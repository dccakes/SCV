import { z } from 'zod'

import { createTRPCRouter, publicProcedure } from '~/server/api/trpc'

export const guestRouter = createTRPCRouter({
  // delete: publicProcedure
  //   .input(z.object({ guestId: z.string() }))
  //   .query(async ({ ctx, input }) => {}),

  getAllByEventId: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.invitation.findMany({
        where: {
          eventId: input.eventId,
        },
      })
    }),

  getAllByHouseholdId: publicProcedure
    .input(z.object({ householdId: z.string() }))
    .query(async ({ ctx, input }) => {
      const householdGuests = await ctx.db.household.findFirst({
        where: {
          id: input.householdId,
        },
        include: {
          guests: true,
        },
      })

      return householdGuests
    }),

  getAllByUserId: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.userId) return
    const guestList = await ctx.db.guest.findMany({
      where: {
        userId: ctx.auth.userId,
      },
    })

    return guestList
  }),
})
