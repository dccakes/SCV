'use client'

import { useState } from 'react'
import { SuggestionCard } from '~/components/etta/SuggestionCard'
import type { EttaSuggestionView } from '~/lib/etta/types'

interface PendingSuggestionsFeedProps {
  suggestions: Array<EttaSuggestionView>
}

export function PendingSuggestionsFeed({ suggestions: initial }: PendingSuggestionsFeedProps) {
  const [suggestions, setSuggestions] = useState<EttaSuggestionView[]>(initial)

  function restoreItem(id: string) {
    const removed = initial.find((s) => s.id === id)
    if (removed) {
      setSuggestions((prev) =>
        [...prev, removed].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      )
    }
  }

  async function handleAction(id: string, action: 'approve' | 'dismiss') {
    setSuggestions((prev) => prev.filter((s) => s.id !== id))

    try {
      const res = await fetch(`/api/etta/approve/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!res.ok) restoreItem(id)
    } catch {
      restoreItem(id)
    }
  }

  return (
    <div>
      <div className='mb-4 flex items-center gap-2'>
        <h2 className='font-semibold text-gray-900 text-lg'>Etta&apos;s Suggestions</h2>
        {suggestions.length > 0 && (
          <span className='inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-200 px-1.5 font-medium text-gray-700 text-xs'>
            {suggestions.length}
          </span>
        )}
      </div>

      {suggestions.length === 0 ? (
        <p className='py-8 text-center text-gray-400 text-sm'>No pending suggestions</p>
      ) : (
        <div className='flex flex-col gap-3'>
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onApprove={(id) => handleAction(id, 'approve')}
              onDismiss={(id) => handleAction(id, 'dismiss')}
            />
          ))}
        </div>
      )}
    </div>
  )
}
