'use client'

import { Check, Copy, Link2, RefreshCw, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { api } from '~/trpc/react'

export function SelfInviteLinkManager() {
  const [copied, setCopied] = useState(false)

  const { data: tokenData, isLoading, refetch } = api.selfFill.getToken.useQuery()

  const generateToken = api.selfFill.generateToken.useMutation({
    onSuccess: () => {
      void refetch()
      toast.success('Invite link generated!')
    },
    onError: () => {
      toast.error('Failed to generate invite link')
    },
  })

  const revokeToken = api.selfFill.revokeToken.useMutation({
    onSuccess: () => {
      void refetch()
      toast.success('Invite link revoked')
    },
    onError: () => {
      toast.error('Failed to revoke invite link')
    },
  })

  const joinUrl =
    tokenData?.token && typeof window !== 'undefined'
      ? `${window.location.origin}/join/${tokenData.token}`
      : null

  const handleCopy = async () => {
    if (!joinUrl) return
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  if (isLoading) {
    return null
  }

  if (!tokenData?.token) {
    return (
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={() => generateToken.mutate({})}
        disabled={generateToken.isPending}
      >
        <Link2 className='mr-2 h-3.5 w-3.5' aria-hidden='true' />
        Generate Invite Link
      </Button>
    )
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center gap-2'>
        <div className='min-w-0 flex-1 rounded-md border border-border bg-muted/40 px-3 py-2'>
          <p className='truncate font-mono text-muted-foreground text-xs'>{joinUrl}</p>
        </div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={handleCopy}
          aria-label={copied ? 'Copied!' : 'Copy invite link'}
        >
          {copied ? (
            <Check className='h-4 w-4 text-green-600' aria-hidden='true' />
          ) : (
            <Copy className='h-4 w-4' aria-hidden='true' />
          )}
        </Button>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => generateToken.mutate({})}
          disabled={generateToken.isPending}
          aria-label='Reset invite link'
          title='Reset link (old link stops working)'
        >
          <RefreshCw
            className={`h-4 w-4 ${generateToken.isPending ? 'animate-spin' : ''}`}
            aria-hidden='true'
          />
        </Button>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => revokeToken.mutate({})}
          disabled={revokeToken.isPending}
          aria-label='Revoke invite link'
          title='Revoke link'
          className='text-destructive hover:text-destructive'
        >
          <X className='h-4 w-4' aria-hidden='true' />
        </Button>
      </div>
      {tokenData.expiresAt && (
        <p className='text-muted-foreground text-xs'>
          Link expires {new Date(tokenData.expiresAt).toLocaleDateString()}
        </p>
      )}
      {tokenData.expiresAt &&
        tokenData.earliestEventDate &&
        new Date(tokenData.expiresAt) < new Date(tokenData.earliestEventDate) && (
          <p className='text-destructive text-xs'>This link expires before your earliest event</p>
        )}
    </div>
  )
}
