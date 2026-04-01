'use client'

import Link from 'next/link'
import { useState } from 'react'

import { formatMessageDate } from '~/components/inbox/format-date'
import ThreadView from '~/components/inbox/thread-view'
import { DIRECTION_INBOUND } from '~/server/domains/gmail/gmail.types'
import { api } from '~/trpc/react'

export default function InboxView() {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const limit = 20

  const connectionQuery = api.gmail.getConnection.useQuery()
  const messagesQuery = api.gmail.listMessages.useQuery(
    { limit, offset: page * limit },
    { enabled: connectionQuery.data?.connected === true }
  )
  const syncMutation = api.gmail.sync.useMutation({
    onSuccess: () => messagesQuery.refetch(),
  })

  // Not connected — prompt to connect
  if (connectionQuery.data && !connectionQuery.data.connected) {
    return (
      <div className='flex flex-col items-center justify-center px-4 py-16 text-center'>
        <div className='flex h-16 w-16 items-center justify-center rounded-full bg-muted'>
          <svg viewBox='0 0 24 24' className='h-8 w-8 text-foreground/40' fill='currentColor'>
            <path d='M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z' />
          </svg>
        </div>
        <h2 className='mt-4 font-serif text-lg text-foreground'>Connect Gmail to get started</h2>
        <p className='mt-1 max-w-sm font-mono text-xs text-foreground/50'>
          Link your Gmail account to see vendor communications directly in your wedding planner.
        </p>
        <Link
          href='/settings?tab=connections'
          className='mt-6 rounded-sm bg-foreground px-4 py-2 font-mono text-[0.62rem] text-background uppercase tracking-widest transition-colors hover:bg-primary hover:text-primary-foreground'
        >
          Go to Settings
        </Link>
      </div>
    )
  }

  // Thread view
  if (selectedThreadId) {
    return <ThreadView threadId={selectedThreadId} onBack={() => setSelectedThreadId(null)} />
  }

  const messages = messagesQuery.data?.messages ?? []
  const total = messagesQuery.data?.total ?? 0
  const hasNextPage = (page + 1) * limit < total
  const hasPrevPage = page > 0

  return (
    <div className='flex h-full flex-col'>
      {/* Toolbar */}
      <div className='flex items-center justify-between border-border/80 border-b px-4 py-3 lg:px-6'>
        <div className='flex items-center gap-2'>
          <h2 className='font-mono text-xs text-foreground/60 uppercase tracking-wider'>
            Vendor Communications
          </h2>
          {total > 0 && (
            <span className='font-mono text-[0.6rem] text-foreground/40'>
              {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
            </span>
          )}
        </div>
        <button
          type='button'
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className='rounded-sm border border-border px-3 py-1.5 font-mono text-[0.62rem] text-foreground/70 uppercase tracking-widest transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50'
        >
          {syncMutation.isPending ? 'Syncing...' : 'Sync now'}
        </button>
      </div>

      {/* Message list */}
      <div className='flex-1 overflow-y-auto'>
        {messagesQuery.isLoading && (
          <div className='px-4 py-8 text-center font-mono text-xs text-foreground/50'>
            Loading messages...
          </div>
        )}

        {messagesQuery.isError && (
          <div className='px-4 py-8 text-center font-mono text-xs text-destructive'>
            Failed to load messages. Please try again.
          </div>
        )}

        {!messagesQuery.isLoading && messages.length === 0 && (
          <div className='flex flex-col items-center px-4 py-16 text-center'>
            <p className='font-mono text-xs text-foreground/50'>
              No vendor messages yet. Messages will appear here after syncing.
            </p>
            <p className='mt-1 font-mono text-[0.6rem] text-foreground/30'>
              Make sure your vendors have contact emails set.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <button
            key={msg.id}
            type='button'
            onClick={() => msg.externalThreadId && setSelectedThreadId(msg.externalThreadId)}
            className='w-full border-border/60 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50 lg:px-6'
          >
            <div className='flex items-center justify-between gap-4'>
              <div className='flex items-center gap-2 truncate'>
                <span className='truncate text-sm font-medium text-foreground'>
                  {msg.direction === DIRECTION_INBOUND ? msg.senderName ?? msg.senderAddress : `To: ${msg.recipientAddresses[0]}`}
                </span>
                {msg.vendorName && (
                  <span className='shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[0.55rem] text-foreground/50'>
                    {msg.vendorName}
                  </span>
                )}
              </div>
              <span className='shrink-0 font-mono text-[0.6rem] text-foreground/40'>
                {formatMessageDate(msg.sentAt)}
              </span>
            </div>
            {msg.subject && (
              <p className='mt-0.5 truncate text-sm text-foreground/80'>{msg.subject}</p>
            )}
            {msg.snippet && (
              <p className='mt-0.5 truncate font-mono text-xs text-foreground/40'>{msg.snippet}</p>
            )}
          </button>
        ))}
      </div>

      {/* Pagination */}
      {(hasPrevPage || hasNextPage) && (
        <div className='flex items-center justify-between border-border/80 border-t px-4 py-2 lg:px-6'>
          <button
            type='button'
            onClick={() => setPage((p) => p - 1)}
            disabled={!hasPrevPage}
            className='rounded-sm px-3 py-1.5 font-mono text-[0.62rem] text-foreground/70 uppercase tracking-widest transition-colors hover:text-foreground disabled:invisible'
          >
            Previous
          </button>
          <button
            type='button'
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNextPage}
            className='rounded-sm px-3 py-1.5 font-mono text-[0.62rem] text-foreground/70 uppercase tracking-widest transition-colors hover:text-foreground disabled:invisible'
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

