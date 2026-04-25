'use client'

import { toast } from 'sonner'
import type { Domain } from '~/lib/etta/types'
import { api } from '~/trpc/react'

type SuggestionReviewAction = 'approve' | 'dismiss'

type ReviewSuggestionParams = {
  action: SuggestionReviewAction
  domain: Domain
  suggestionId: string
}

export function useSuggestionReviewAction(): (params: ReviewSuggestionParams) => Promise<boolean> {
  const utils = api.useUtils()

  return async function reviewSuggestion({
    action,
    domain,
    suggestionId,
  }: ReviewSuggestionParams): Promise<boolean> {
    try {
      const response = await fetch(`/api/etta/approve/${suggestionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        toast.error(body?.error ?? 'Unable to review this suggestion right now.')
        return false
      }

      await Promise.all([
        utils.etta.getPendingByDomain.invalidate({ domain }),
        utils.etta.getPendingCounts.invalidate(),
        utils.etta.getAll.invalidate(),
      ])

      return true
    } catch {
      toast.error('Network error while reviewing the suggestion.')
      return false
    }
  }
}
