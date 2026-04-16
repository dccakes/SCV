import { tool, zodSchema } from 'ai'
import { z } from 'zod'

import { RSVP_STATUS } from '~/lib/constants/rsvp'
import type { EttaContext } from '~/lib/etta/types'
import { requirePlannerAuthz } from '~/lib/etta/utils/authorization'
import { guestInsightsService } from '~/server/application/guest-insights'
import { householdManagementService } from '~/server/application/household-management'
import { guestService } from '~/server/domains/guest'
import type { Household } from '~/server/domains/household/household.types'

const rsvpFilterSchema = z.enum([
  RSVP_STATUS.ATTENDING,
  RSVP_STATUS.DECLINED,
  RSVP_STATUS.INVITED,
  RSVP_STATUS.NOT_INVITED,
])

export function getGuestTools(ctx: EttaContext) {
  return {
    get_guest_list: tool({
      description: 'Get the complete guest list for the wedding',
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        const authz = requirePlannerAuthz(ctx)
        const guests = await guestInsightsService.listGuests(authz, ctx.weddingId)
        return { guests }
      },
    }),

    update_guest: tool({
      description:
        "Update a guest's information including name, email, phone, mailing address, and tags",
      inputSchema: zodSchema(
        z.object({
          guestId: z.number(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          email: z.string().nullable().optional(),
          phone: z.string().nullable().optional(),
          address1: z.string().nullable().optional(),
          address2: z.string().nullable().optional(),
          city: z.string().nullable().optional(),
          state: z.string().nullable().optional(),
          zipCode: z.string().nullable().optional(),
          country: z.string().nullable().optional(),
          tagIds: z.array(z.string()).optional(),
        })
      ),
      execute: async ({
        guestId,
        tagIds,
        address1,
        address2,
        city,
        state,
        zipCode,
        country,
        ...guestData
      }) => {
        const authz = requirePlannerAuthz(ctx)

        const hasGuestUpdate = Object.values(guestData).some((v) => v !== undefined)
        const guest = hasGuestUpdate
          ? await guestService.updateGuest(authz, ctx.weddingId, guestId, guestData)
          : await guestService.getById(guestId)

        if (!guest) {
          return { error: 'Guest not found' }
        }

        const addressData = { address1, address2, city, state, zipCode, country }
        const hasAddressUpdate = Object.values(addressData).some((v) => v !== undefined)
        const household = hasAddressUpdate
          ? await householdManagementService.updateHouseholdAddress(
              authz,
              ctx.weddingId,
              guest.householdId,
              addressData
            )
          : undefined

        if (tagIds !== undefined) {
          await guestService.updateGuestTags(authz, ctx.weddingId, guestId, tagIds)
        }

        return { guest, household }
      },
    }),

    get_rsvp_summary: tool({
      description: 'Get RSVP statistics for the wedding',
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        const authz = requirePlannerAuthz(ctx)
        return guestInsightsService.getRsvpSummary(authz, ctx.weddingId)
      },
    }),

    get_guest_event_attendance: tool({
      description:
        'Look up which wedding events a specific guest is invited to or attending, including RSVP status',
      inputSchema: zodSchema(
        z.object({
          guestQuery: z.string().min(1),
        })
      ),
      execute: async ({ guestQuery }) => {
        const authz = requirePlannerAuthz(ctx)
        return guestInsightsService.getGuestEventAttendance(authz, ctx.weddingId, guestQuery)
      },
    }),

    list_event_attendance: tool({
      description:
        'List guests for a specific event, optionally filtered by RSVP status such as attending or declined',
      inputSchema: zodSchema(
        z.object({
          eventQuery: z.string().min(1),
          rsvpFilter: rsvpFilterSchema.optional(),
        })
      ),
      execute: async ({ eventQuery, rsvpFilter }) => {
        const authz = requirePlannerAuthz(ctx)
        return guestInsightsService.listEventAttendance(
          authz,
          ctx.weddingId,
          eventQuery,
          rsvpFilter
        )
      },
    }),
  }
}
