'use client'

import { formatDistanceToNow } from 'date-fns'
import type { EttaSuggestionView } from '~/lib/etta/types'

interface SuggestionCardProps {
  suggestion: EttaSuggestionView
  isSaving?: boolean
  onApprove: (id: string) => void
  onDismiss: (id: string) => void
}

export function SuggestionCard({
  suggestion,
  isSaving = false,
  onApprove,
  onDismiss,
}: SuggestionCardProps) {
  const tierStyles =
    suggestion.tier === 'T1'
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : 'bg-red-100 text-red-800 border-red-200'
  const statusLabel = suggestion.status.charAt(0).toUpperCase() + suggestion.status.slice(1)

  const statusStyles = {
    pending: 'border-sky-200 bg-sky-100 text-sky-800',
    approved: 'border-indigo-200 bg-indigo-100 text-indigo-800',
    dismissed: 'border-slate-200 bg-slate-100 text-slate-700',
    actioned: 'border-emerald-200 bg-emerald-100 text-emerald-800',
    failed: 'border-rose-200 bg-rose-100 text-rose-800',
  }[suggestion.status]

  const showPendingActions = suggestion.status === 'pending'
  const showRetryAction = suggestion.status === 'failed'
  const showReadOnlyState =
    suggestion.status === 'approved' ||
    suggestion.status === 'actioned' ||
    suggestion.status === 'dismissed' ||
    suggestion.status === 'failed'

  return (
    <div className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm'>
      <div className='mb-2 flex flex-wrap items-center gap-2'>
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 font-semibold text-xs ${tierStyles}`}
        >
          {suggestion.tier}
        </span>
        <span className='rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-600 text-xs'>
          {suggestion.domain}
        </span>
        <span className='rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-600 text-xs'>
          {suggestion.actionType}
        </span>
        <span className={`rounded-full border px-2 py-0.5 font-medium text-xs ${statusStyles}`}>
          {statusLabel}
        </span>
        <span className='ml-auto text-gray-400 text-xs'>
          {formatDistanceToNow(new Date(suggestion.createdAt), { addSuffix: true })}
        </span>
      </div>

      <p className='mb-3 text-gray-800 text-sm leading-relaxed'>{suggestion.summary}</p>

      {suggestion.status === 'failed' && suggestion.failureReason ? (
        <p className='mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800 text-xs'>
          {suggestion.failureReason}
        </p>
      ) : null}

      {showReadOnlyState ? (
        <p className='text-gray-500 text-sm'>
          {suggestion.status === 'approved' && 'Etta is working on this suggestion now.'}
          {suggestion.status === 'actioned' && 'Etta completed this suggestion.'}
          {suggestion.status === 'dismissed' && 'This suggestion was dismissed.'}
          {suggestion.status === 'failed' && 'Retry this suggestion to ask Etta to run it again.'}
        </p>
      ) : null}

      {(showPendingActions || showRetryAction) && (
        <div className='flex gap-2'>
          {showPendingActions ? (
            <>
              <button
                type='button'
                disabled={isSaving}
                onClick={() => onApprove(suggestion.id)}
                className='rounded-md bg-emerald-600 px-3 py-1.5 font-medium text-white text-xs transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'
              >
                {isSaving ? 'Saving…' : 'Approve'}
              </button>
              <button
                type='button'
                disabled={isSaving}
                onClick={() => onDismiss(suggestion.id)}
                className='rounded-md px-3 py-1.5 font-medium text-gray-500 text-xs transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'
              >
                Dismiss
              </button>
            </>
          ) : null}

          {showRetryAction ? (
            <button
              type='button'
              disabled={isSaving}
              onClick={() => onApprove(suggestion.id)}
              className='rounded-md bg-foreground px-3 py-1.5 font-medium text-background text-xs transition-colors hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'
            >
              {isSaving ? 'Saving…' : 'Retry'}
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}
