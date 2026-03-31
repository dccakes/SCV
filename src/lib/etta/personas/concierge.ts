/**
 * Concierge Persona — Restricted tool set for guests
 *
 * Read-only public wedding info + own guest record.
 * Can write: RSVP, dietary, address, flag questions.
 */

import type { EttaContext } from '~/lib/etta/types'
import { getConciergeTools as getConciergeToolSet } from '~/lib/etta/tools/concierge'

export function getConciergeTools(ctx: EttaContext) {
  return {
    ...getConciergeToolSet(ctx),
  }
}
