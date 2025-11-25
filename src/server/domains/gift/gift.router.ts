/**
 * Gift Domain - Router
 *
 * tRPC router for gift-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { giftService } from '~/server/domains/gift'
import { updateGiftSchema } from '~/server/domains/gift/gift.validator'

export const giftRouter = createTRPCRouter({
  /**
   * Update a gift
   */
  update: protectedProcedure.input(updateGiftSchema).mutation(async ({ input }) => {
    return giftService.updateGift(input)
  }),
})
