'use client'

import Link from 'next/link'
import { useState } from 'react'

import ThreadView from '~/components/inbox/thread-view'
import { api } from '~/trpc/react'

export default function InboxView() {
  const [query, setQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)

  const connectionQuery = api.gmail.getConnection.useQuery()
  const messagesQuery = api.gmail.listMessages.useQuery(
    { query: query || undefined, maxResults: 20 },
    { enabled: connectionQuery.data?.connected === true }
  )

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
          Link your Gmail account to read emails and create draft replies directly from your wedding
          planner.
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
    return (
      <ThreadView
        threadId={selectedThreadId}
        onBack={() => setSelectedThreadId(null)}
      />
    )
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setQuery(searchInput)
  }

  return (
    <div className='flex h-full flex-col'>
      {/* Search bar */}
      <div className='border-border/80 border-b px-4 py-3 lg:px-6'>
        <form onSubmit={handleSearch} className='flex gap-2'>
          <input
            type='text'
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder='Search emails...'
            className='flex-1 rounded-sm border border-border bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-foreground/40 focus:border-foreground/40 focus:outline-none'
          />
          <button
            type='submit'
            className='rounded-sm border border-border px-4 py-2 font-mono text-[0.62rem] text-foreground/70 uppercase tracking-widest transition-colors hover:border-foreground hover:text-foreground'
          >
            Search
          </button>
        </form>
      </div>

      {/* Message list */}
      <div className='flex-1 overflow-y-auto'>
        {messagesQuery.isLoading && (
          <div className='px-4 py-8 text-center font-mono text-xs text-foreground/50'>
            Loading emails...
          </div>
        )}

        {messagesQuery.isError && (
          <div className='px-4 py-8 text-center font-mono text-xs text-destructive'>
            Failed to load emails. Please try again.
          </div>
        )}

        {messagesQuery.data?.messages.length === 0 && (
          <div className='px-4 py-8 text-center font-mono text-xs text-foreground/50'>
            No emails found.
          </div>
        )}

        {messagesQuery.data?.messages.map((msg) => (
          <button
            key={msg.id}
            type='button'
            onClick={() => setSelectedThreadId(msg.threadId)}
            className='w-full border-border/60 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50 lg:px-6'
          >
            <div className='flex items-center justify-between gap-4'>
              <span className='truncate text-sm font-medium text-foreground'>{msg.from}</span>
              <span className='shrink-0 font-mono text-[0.6rem] text-foreground/40'>
                {formatDate(msg.date)}
              </span>
            </div>
            <p className='mt-0.5 truncate text-sm text-foreground/80'>{msg.subject}</p>
            <p className='mt-0.5 truncate font-mono text-xs text-foreground/40'>{msg.snippet}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    }

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}
