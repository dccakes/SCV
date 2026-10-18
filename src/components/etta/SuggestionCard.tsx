'use client'

import { formatDistanceToNow } from 'date-fns'
import type { EttaSuggestionView } from '~/lib/etta/types'

interface SuggestionCardProps {
  suggestion: EttaSuggestionView
  onApprove: (id: string) => void
  onDismiss: (id: string) => void
}

export function SuggestionCard({ suggestion, onApprove, onDismiss }: SuggestionCardProps) {
  const tierStyles =
    suggestion.tier === 'T1'
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : 'bg-red-100 text-red-800 border-red-200'

  return (
    <div className='rounded-lg border border-border bg-white p-4 shadow-sm'>
      <div className='mb-2 flex items-center gap-2'>
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 font-semibold text-xs ${tierStyles}`}
        >
          {suggestion.tier}
        </span>
        <span className='rounded bg-secondary px-2 py-0.5 font-medium text-secondary-foreground text-xs'>
          {suggestion.actionType}
        </span>
        <span className='ml-auto text-muted-foreground text-xs'>
          {formatDistanceToNow(new Date(suggestion.createdAt), { addSuffix: true })}
        </span>
      </div>

      <p className='mb-3 text-foreground text-sm leading-relaxed'>{suggestion.summary}</p>

      <div className='flex gap-2'>
        <button
          type='button'
          onClick={() => onApprove(suggestion.id)}
          className='rounded-md bg-emerald-600 px-3 py-1.5 font-medium text-white text-xs transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2'
        >
          Approve
        </button>
        <button
          type='button'
          onClick={() => onDismiss(suggestion.id)}
          className='rounded-md px-3 py-1.5 font-medium text-muted-foreground text-xs transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
