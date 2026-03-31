'use client'

import { useState } from 'react'

import DraftComposer from '~/components/inbox/draft-composer'
import { api } from '~/trpc/react'

type ThreadViewProps = {
  threadId: string
  onBack: () => void
}

export default function ThreadView({ threadId, onBack }: ThreadViewProps) {
  const [showComposer, setShowComposer] = useState(false)

  const threadQuery = api.gmail.getThread.useQuery({ threadId })

  const lastMessage = threadQuery.data?.messages[threadQuery.data.messages.length - 1]

  return (
    <div className='flex h-full flex-col'>
      {/* Header */}
      <div className='flex items-center gap-3 border-border/80 border-b px-4 py-3 lg:px-6'>
        <button
          type='button'
          onClick={onBack}
          className='flex h-9 w-9 items-center justify-center rounded-md text-foreground/60 transition-colors hover:bg-muted hover:text-foreground'
        >
          <svg
            className='h-4 w-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
          >
            <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 19.5L8.25 12l7.5-7.5' />
          </svg>
        </button>
        <h2 className='truncate font-serif text-base text-foreground'>
          {lastMessage?.subject ?? 'Thread'}
        </h2>
      </div>

      {/* Messages */}
      <div className='flex-1 overflow-y-auto px-4 py-4 lg:px-6'>
        {threadQuery.isLoading && (
          <div className='py-8 text-center font-mono text-xs text-foreground/50'>
            Loading thread...
          </div>
        )}

        {threadQuery.isError && (
          <div className='py-8 text-center font-mono text-xs text-destructive'>
            Failed to load thread.
          </div>
        )}

        {threadQuery.data?.messages.map((msg) => (
          <div key={msg.id} className='mb-4 rounded-lg border border-border/80 bg-card p-4'>
            <div className='flex items-center justify-between gap-4'>
              <span className='truncate text-sm font-medium text-foreground'>{msg.from}</span>
              <span className='shrink-0 font-mono text-[0.6rem] text-foreground/40'>
                {formatDate(msg.date)}
              </span>
            </div>
            <div className='mt-1 font-mono text-[0.6rem] text-foreground/40'>To: {msg.to}</div>
            <div className='mt-3 whitespace-pre-wrap text-sm text-foreground/80'>{msg.body}</div>
          </div>
        ))}
      </div>

      {/* Reply action / Composer */}
      <div className='border-border/80 border-t px-4 py-3 lg:px-6'>
        {showComposer && lastMessage ? (
          <DraftComposer
            threadId={threadId}
            to={lastMessage.from}
            subject={
              lastMessage.subject.startsWith('Re:')
                ? lastMessage.subject
                : `Re: ${lastMessage.subject}`
            }
            inReplyTo={lastMessage.id}
            onClose={() => setShowComposer(false)}
          />
        ) : (
          <button
            type='button'
            onClick={() => setShowComposer(true)}
            disabled={!lastMessage}
            className='min-h-[36px] rounded-sm bg-foreground px-4 py-1.5 font-mono text-[0.62rem] text-background uppercase tracking-widest transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2 disabled:opacity-50'
          >
            Reply
          </button>
        )}
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}
