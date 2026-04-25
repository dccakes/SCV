import { z } from 'zod'
import { ETTA_SUGGESTION_DOMAINS, ETTA_SUGGESTION_STATUSES } from '~/lib/etta/types'

export const getPendingByDomainSchema = z.object({
  domain: z.enum(ETTA_SUGGESTION_DOMAINS),
})

export const getAllSuggestionsSchema = z.object({
  status: z.enum(ETTA_SUGGESTION_STATUSES).optional(),
})
