/**
 * Gift Domain - Router
 *
 * tRPC router for gift-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { toAuthzContext } from '~/server/authz/authorization.types'
import { giftService } from '~/server/domains/gift'
import { updateGiftSchema } from '~/server/domains/gift/gift.validator'
import { weddingService } from '~/server/domains/wedding'

export const giftRouter = createTRPCRouter({
  /**
   * Update a gift
   */
  update: protectedProcedure.input(updateGiftSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(
      ctx.auth.userId,
      ctx.auth.activeOrganization?.organizationId ?? null
    )
    return giftService.updateGift(toAuthzContext(ctx), weddingId, input)
  }),
})
