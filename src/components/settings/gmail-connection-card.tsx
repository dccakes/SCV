'use client'

import { useState } from 'react'
import { api } from '~/trpc/react'

export default function GmailConnectionCard() {
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const connectionQuery = api.gmail.getConnection.useQuery()
  const authUrlQuery = api.gmail.getAuthUrl.useQuery(undefined, { enabled: false })
  const disconnectMutation = api.gmail.disconnect.useMutation({
    onSuccess: () => {
      connectionQuery.refetch()
      setIsDisconnecting(false)
    },
  })

  const connected = connectionQuery.data?.connected ?? false
  const email = connectionQuery.data?.email

  const handleConnect = async () => {
    const result = await authUrlQuery.refetch()
    if (result.data?.url) {
      window.location.href = result.data.url
    }
  }

  const handleDisconnect = () => {
    if (isDisconnecting) {
      disconnectMutation.mutate()
    } else {
      setIsDisconnecting(true)
    }
  }

  return (
    <div className='rounded-lg border border-border/80 bg-card p-5'>
      <div className='flex items-start justify-between'>
        <div className='flex items-center gap-3'>
          {/* Gmail icon */}
          <div className='flex h-10 w-10 items-center justify-center rounded-md bg-red-500/10'>
            <svg viewBox='0 0 24 24' className='h-5 w-5 text-red-500' fill='currentColor'>
              <path d='M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z' />
            </svg>
          </div>
          <div>
            <h3 className='font-medium text-foreground text-sm'>Gmail</h3>
            <p className='font-mono text-[0.62rem] text-foreground/50'>
              Read emails &amp; create draft replies
            </p>
          </div>
        </div>
        <div
          className={`mt-1 h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-foreground/20'}`}
        />
      </div>

      {connected && email && (
        <p className='mt-3 truncate font-mono text-[0.62rem] text-foreground/60'>{email}</p>
      )}

      <div className='mt-4 flex items-center gap-2'>
        {connected ? (
          <>
            <button
              type='button'
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
              className='min-h-[36px] rounded-sm border border-border px-3 py-1.5 font-mono text-[0.62rem] text-foreground/70 uppercase tracking-widest transition-colors hover:border-destructive hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2'
            >
              {disconnectMutation.isPending
                ? 'Disconnecting...'
                : isDisconnecting
                  ? 'Confirm disconnect?'
                  : 'Disconnect'}
            </button>
            {isDisconnecting && !disconnectMutation.isPending && (
              <button
                type='button'
                onClick={() => setIsDisconnecting(false)}
                className='min-h-[36px] rounded-sm px-3 py-1.5 font-mono text-[0.62rem] text-foreground/50 uppercase tracking-widest transition-colors hover:text-foreground'
              >
                Cancel
              </button>
            )}
          </>
        ) : (
          <button
            type='button'
            onClick={handleConnect}
            disabled={authUrlQuery.isFetching}
            className='min-h-[36px] rounded-sm bg-foreground px-4 py-1.5 font-mono text-[0.62rem] text-background uppercase tracking-widest transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2'
          >
            {authUrlQuery.isFetching ? 'Connecting...' : 'Connect'}
          </button>
        )}
      </div>
    </div>
  )
}
