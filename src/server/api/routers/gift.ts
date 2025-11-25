import { z } from 'zod'

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'

export const giftRouter = createTRPCRouter({
  update: protectedProcedure
    .input(
      z.object({
        householdId: z.string(),
        eventId: z.string(),
        description: z.string().optional(),
        thankyou: z.boolean(),
      })
    )
    .mutation(({ input, ctx }) => {
      return ctx.db.gift.update({
        where: {
          GiftId: {
            householdId: input.householdId,
            eventId: input.eventId,
          },
        },
        data: {
          description: input.description,
          thankyou: input.thankyou,
        },
      })
    }),
})
