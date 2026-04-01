import { VendorCategory } from '@prisma/client'
import { tool, zodSchema } from 'ai'
import { z } from 'zod'

import type { EttaContext } from '~/lib/etta/types'
import { db } from '~/server/db'
import { vendorService } from '~/server/domains/vendor'

const vendorCategory = z.enum(VendorCategory)

export function getVendorTools(ctx: EttaContext) {
  return {
    get_vendor_list: tool({
      description: 'Get all vendors for the wedding, optionally filtered by category',
      inputSchema: zodSchema(
        z.object({
          category: vendorCategory.optional(),
        })
      ),
      execute: async ({ category }) => {
        const vendors = await vendorService.getVendors(ctx.weddingId, category)
        return { vendors }
      },
    }),

    add_vendor: tool({
      description: 'Suggest adding a new vendor (requires couple approval)',
      inputSchema: zodSchema(
        z.object({
          name: z.string(),
          category: vendorCategory,
          contactName: z.string().optional(),
          contactEmail: z.string().optional(),
          website: z.string().optional(),
        })
      ),
      execute: async (params) => {
        const suggestion = await db.ettaSuggestion.create({
          data: {
            weddingId: ctx.weddingId,
            actorId: ctx.ettaActorId,
            actionType: 'add_vendor',
            tier: 'T1',
            payload: params,
            summary: `Add vendor: ${params.name} (${params.category})`,
            status: 'pending',
          },
        })

        return {
          status: 'pending' as const,
          message: 'Vendor suggestion created for review',
          suggestionId: suggestion.id,
        }
      },
    }),
  }
}
