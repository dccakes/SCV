'use client'

import type { Domain, EttaSuggestionView } from '~/lib/etta/types'
import { api } from '~/trpc/react'

export function useDomainSuggestions(
  domain: Domain,
  initialSuggestions: EttaSuggestionView[] = []
): EttaSuggestionView[] {
  const { data = initialSuggestions } = api.etta.getPendingByDomain.useQuery(
    { domain },
    {
      initialData: initialSuggestions,
      staleTime: 30_000,
    }
  )

  return data
}
