'use client'

import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { api } from '~/trpc/react'

/**
 * Compact, read-only invite-link row.
 * Renders nothing when no token is active.
 * Used in: dashboard sidebar card, add-guest form.
 */
export default function InviteLinkBanner() {
  const [copied, setCopied] = useState(false)
  const { data: tokenData, isError } = api.selfFill.getToken.useQuery()

  useEffect(() => {
    if (isError) toast.error('Failed to load invite link')
  }, [isError])

  if (!tokenData?.token) return null

  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join/${tokenData.token}`
      : `/join/${tokenData.token}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Invite link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className='flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2'>
      <span className='min-w-0 flex-1 truncate font-mono text-muted-foreground text-xs'>{url}</span>
      <Button
        type='button'
        variant='ghost'
        size='sm'
        className='h-7 shrink-0 px-2'
        onClick={handleCopy}
      >
        {copied ? <Check className='h-3.5 w-3.5' /> : <Copy className='h-3.5 w-3.5' />}
        <span className='ml-1.5 text-xs'>{copied ? 'Copied!' : 'Copy'}</span>
      </Button>
    </div>
  )
}
