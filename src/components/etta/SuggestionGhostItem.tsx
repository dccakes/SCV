'use client'

import { useState } from 'react'
import { useSuggestionReviewAction } from '~/components/etta/use-suggestion-review-action'
import type { EttaSuggestionView } from '~/lib/etta/types'

type SuggestionGhostItemProps = {
  suggestion: EttaSuggestionView
}

export function SuggestionGhostItem({ suggestion }: Readonly<SuggestionGhostItemProps>) {
  const reviewSuggestion = useSuggestionReviewAction()
  const [hidden, setHidden] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  if (hidden) return null

  async function handleAction(action: 'approve' | 'dismiss') {
    setIsSaving(true)

    try {
      const success = await reviewSuggestion({
        action,
        domain: suggestion.domain,
        suggestionId: suggestion.id,
      })

      if (success) {
        setHidden(true)
      }
    } catch {
      setHidden(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      aria-live='polite'
      className='rounded-lg border border-primary/35 border-dashed bg-primary/[0.04] p-4'
    >
      <div className='mb-2 flex items-center gap-2'>
        <span className='font-mono text-[0.58rem] text-primary uppercase tracking-[0.18em]'>
          Etta suggests
        </span>
        <span className='rounded-full border border-primary/20 bg-background px-2 py-0.5 font-mono text-[0.58rem] text-muted-foreground uppercase tracking-wider'>
          {suggestion.actionType.replaceAll('_', ' ')}
        </span>
      </div>

      <p className='mb-3 text-foreground/80 text-sm leading-relaxed'>{suggestion.summary}</p>

      <div className='flex gap-2'>
        <button
          type='button'
          disabled={isSaving}
          onClick={() => handleAction('approve')}
          className='rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground text-xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'
        >
          {isSaving ? 'Saving…' : 'Add'}
        </button>
        <button
          type='button'
          disabled={isSaving}
          onClick={() => handleAction('dismiss')}
          className='rounded-md px-3 py-1.5 font-medium text-muted-foreground text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'
        >
          Skip
        </button>
      </div>
    </div>
  )
}
