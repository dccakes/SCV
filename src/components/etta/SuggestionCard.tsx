'use client'

interface Suggestion {
  id: string
  summary: string
  tier: 'T1' | 'T2'
  actionType: string
  createdAt: string
  payload: Record<string, unknown>
}

interface SuggestionCardProps {
  suggestion: Suggestion
  onApprove: (id: string) => void
  onDismiss: (id: string) => void
}

function relativeTime(dateString: string): string {
  const now = Date.now()
  const then = new Date(dateString).getTime()
  const diffSeconds = Math.floor((now - then) / 1000)

  if (diffSeconds < 60) return 'just now'
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

export function SuggestionCard({ suggestion, onApprove, onDismiss }: SuggestionCardProps) {
  const tierStyles =
    suggestion.tier === 'T1'
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : 'bg-red-100 text-red-800 border-red-200'

  return (
    <div className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm'>
      <div className='mb-2 flex items-center gap-2'>
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 font-semibold text-xs ${tierStyles}`}
        >
          {suggestion.tier}
        </span>
        <span className='rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-600 text-xs'>
          {suggestion.actionType}
        </span>
        <span className='ml-auto text-gray-400 text-xs'>{relativeTime(suggestion.createdAt)}</span>
      </div>

      <p className='mb-3 text-gray-800 text-sm leading-relaxed'>{suggestion.summary}</p>

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
          className='rounded-md px-3 py-1.5 font-medium text-gray-500 text-xs transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2'
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
