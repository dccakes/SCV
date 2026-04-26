import { VendorCategory } from '@prisma/client'
import { tool, zodSchema } from 'ai'
import { z } from 'zod'

import type { EttaContext } from '~/lib/etta/types'
import { requireEttaPermission, requirePlannerAuthz } from '~/lib/etta/utils/authorization'
import { vendorInsightsService } from '~/server/application/vendor-insights'
import { db } from '~/server/db'
import {
  addVendorNoteSchema,
  getCategoryConfigSchema,
  updateQuoteSchema,
  updateVendorSchema,
  vendorService,
} from '~/server/domains/vendor'

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
        const authz = requirePlannerAuthz(ctx)
        const vendors = await vendorInsightsService.listVendors(authz, ctx.weddingId, category)
        return { vendors }
      },
    }),

    get_category_config: tool({
      description:
        'Get the active custom field definitions for a vendor category, including wedding-specific overrides when present',
      inputSchema: zodSchema(getCategoryConfigSchema),
      execute: async ({ category }) => {
        const authz = requirePlannerAuthz(ctx)
        const config = await vendorService.getCategoryConfig(authz, ctx.weddingId, category)
        return { fieldDefinitions: config.fieldDefinitions }
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

    update_vendor: tool({
      description:
        'Update vendor details directly, including contact information, scratchpad notes, contacted state, and custom field values',
      inputSchema: zodSchema(updateVendorSchema),
      execute: async ({ vendorId, ...data }) => {
        const authz = requirePlannerAuthz(ctx)
        const vendor = await vendorService.updateVendor(authz, vendorId, ctx.weddingId, {
          vendorId,
          ...data,
        })
        return { vendor }
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
      inputSchema: zodSchema(updateQuoteSchema),
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

    add_vendor_note: tool({
      description:
        "Add a note to a vendor's interaction log to record outreach, follow-ups, or context discovered during planning",
      inputSchema: zodSchema(addVendorNoteSchema),
      execute: async ({ vendorId, message }) => {
        const authz = requirePlannerAuthz(ctx)
        const note = await vendorService.addVendorNote(
          authz,
          vendorId,
          ctx.weddingId,
          message,
          'etta'
        )
        return { noteId: note.id, message: 'Note added to vendor interaction log' }
      },
    }),
  }
}
