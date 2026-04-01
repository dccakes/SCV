/**
 * Concierge Persona — Restricted tool set for guests
 *
 * Read-only public wedding info + own guest record.
 * Can write: RSVP, dietary, address, flag questions.
 */

import { getConciergeTools as getConciergeToolSet } from '~/lib/etta/tools/concierge'
import type { EttaContext } from '~/lib/etta/types'

export function getConciergeTools(ctx: EttaContext) {
  return {
    ...getConciergeToolSet(ctx),
  }
}
