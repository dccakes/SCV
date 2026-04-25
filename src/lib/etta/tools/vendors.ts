import { QuoteType, VendorCategory } from '@prisma/client'
import { tool, zodSchema } from 'ai'
import { z } from 'zod'

import type { EttaContext } from '~/lib/etta/types'
import { requireEttaPermission, requirePlannerAuthz } from '~/lib/etta/utils/authorization'
import { vendorInsightsService } from '~/server/application/vendor-insights'
import { db } from '~/server/db'
import { vendorService } from '~/server/domains/vendor'

const vendorCategory = z.enum(VendorCategory)
const quoteType = z.enum(QuoteType)

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
        const authz = requirePlannerAuthz(ctx)
        const vendors = await vendorInsightsService.listVendors(authz, ctx.weddingId, category)
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
        requireEttaPermission(ctx, { vendor: ['create'] })
        const suggestion = await db.ettaSuggestion.create({
          data: {
            weddingId: ctx.weddingId,
            actorId: ctx.ettaActorId,
            domain: 'vendors',
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

    get_vendor_quote: tool({
      description: 'Get a specific vendor quote, including any attached documents',
      inputSchema: zodSchema(
        z.object({
          vendorId: z.string().min(1),
          quoteId: z.string().min(1),
        })
      ),
      execute: async ({ vendorId, quoteId }) => {
        const authz = requirePlannerAuthz(ctx)
        const quote = await vendorInsightsService.getQuote(authz, ctx.weddingId, vendorId, quoteId)
        return { quote }
      },
    }),

    update_vendor_quote: tool({
      description: 'Update a specific vendor quote, including its amount, type, date, or notes',
      inputSchema: zodSchema(
        z.object({
          vendorId: z.string().min(1),
          quoteId: z.string().min(1),
          price: z.number().positive().max(10_000_000).optional(),
          quoteType: quoteType.optional(),
          quoteDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
          notes: z.string().max(5000).optional(),
        })
      ),
      execute: async ({ vendorId, quoteId, ...data }) => {
        const authz = requirePlannerAuthz(ctx)
        const quote = await vendorService.updateQuote(authz, quoteId, vendorId, ctx.weddingId, {
          quoteId,
          vendorId,
          ...data,
        })
        return { quote }
      },
    }),
  }
}
