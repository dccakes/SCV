'use client'

import { useState } from 'react'
import { SuggestionCard } from '~/components/etta/SuggestionCard'
import { useSuggestionReviewAction } from '~/components/etta/use-suggestion-review-action'
import type { EttaSuggestionView } from '~/lib/etta/types'
import { api } from '~/trpc/react'

interface PendingSuggestionsFeedProps {
  suggestions: Array<EttaSuggestionView>
}

const FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Actioned', value: 'actioned' },
  { label: 'Failed', value: 'failed' },
] as const

type SuggestionFilter = (typeof FILTER_OPTIONS)[number]['value']

export function PendingSuggestionsFeed({ suggestions: initial }: PendingSuggestionsFeedProps) {
  const reviewSuggestion = useSuggestionReviewAction()
  const [activeFilter, setActiveFilter] = useState<SuggestionFilter>('pending')
  const [savingSuggestionId, setSavingSuggestionId] = useState<string | null>(null)
  const { data: suggestions = initial } = api.etta.getAll.useQuery(
    {},
    {
      initialData: initial,
      staleTime: 30_000,
      refetchInterval: activeFilter === 'pending' || activeFilter === 'all' ? 15_000 : false,
      refetchIntervalInBackground: false,
    }
  )

  function sortSuggestions(items: EttaSuggestionView[]) {
    return [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  function matchesFilter(suggestion: EttaSuggestionView) {
    if (activeFilter === 'all') return true
    return suggestion.status === activeFilter
  }

  async function handleAction(id: string, action: 'approve' | 'dismiss') {
    const suggestion = suggestions.find((item) => item.id === id)
    if (!suggestion) return

    setSavingSuggestionId(id)
    try {
      await reviewSuggestion({
        action,
        domain: suggestion.domain,
        suggestionId: id,
      })
    } finally {
      setSavingSuggestionId((current) => (current === id ? null : current))
    }
  }

  const visibleSuggestions = sortSuggestions(suggestions).filter(matchesFilter)
  const emptyStateLabel =
    activeFilter === 'all'
      ? 'No suggestions yet.'
      : `No suggestions match the ${
          activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)
        } filter.`

  return (
    <div>
      <div className='mb-4 flex flex-wrap items-center gap-2'>
        <h2 className='font-semibold text-gray-900 text-lg'>Etta&apos;s Suggestions</h2>
        {visibleSuggestions.length > 0 && (
          <span className='inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-200 px-1.5 font-medium text-gray-700 text-xs'>
            {visibleSuggestions.length}
          </span>
        )}
      </div>

      <div className='mb-4 flex flex-wrap gap-2'>
        {FILTER_OPTIONS.map((option) => {
          const isActive = option.value === activeFilter

          return (
            <button
              key={option.value}
              type='button'
              aria-pressed={isActive}
              onClick={() => setActiveFilter(option.value)}
              className={`rounded-full border px-3 py-1.5 font-medium text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 ${
                isActive
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      {visibleSuggestions.length === 0 ? (
        <p className='py-8 text-center text-gray-400 text-sm'>{emptyStateLabel}</p>
      ) : (
        <div className='flex flex-col gap-3'>
          {visibleSuggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              isSaving={savingSuggestionId === suggestion.id}
              onApprove={(id) => handleAction(id, 'approve')}
              onDismiss={(id) => handleAction(id, 'dismiss')}
            />
          ))}
        </div>
      )}
    </div>
  )
}
