/**
 * Planner Persona — Full tool set for authenticated couples
 *
 * Provides read/write access to all wedding data:
 * guests, vendors, budget, timeline, memory, suggestions, outbound, research.
 */

import { getBudgetTools } from '~/lib/etta/tools/budget'
import { getCommunicationLogTools } from '~/lib/etta/tools/communication-log'
import { getDocumentTools } from '~/lib/etta/tools/documents'
import { getGuestTools } from '~/lib/etta/tools/guests'
import { getMemoryTools } from '~/lib/etta/tools/memory'
import { getOutboundTools } from '~/lib/etta/tools/outbound'
import { getResearchTools } from '~/lib/etta/tools/research'
import { getSuggestionTools } from '~/lib/etta/tools/suggestions'
import { getTimelineTools } from '~/lib/etta/tools/timeline'
import { getVendorTools } from '~/lib/etta/tools/vendors'
import type { EttaContext } from '~/lib/etta/types'

export function getPlannerTools(ctx: EttaContext) {
  return {
    ...getGuestTools(ctx),
    ...getCommunicationLogTools(ctx),
    ...getVendorTools(ctx),
    ...getBudgetTools(ctx),
    ...getTimelineTools(ctx),
    ...getSuggestionTools(ctx),
    ...getMemoryTools(ctx),
    ...getOutboundTools(ctx),
    ...getDocumentTools(ctx),
    ...getResearchTools(),
  }
}
