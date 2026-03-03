'use client'

import { AlertTriangle, Check, Copy, Link2, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { api } from '~/trpc/react'

function LinkExpiryNotice({
  expiresAt,
  earliestEventDate,
}: {
  expiresAt: Date
  earliestEventDate: Date | null
}) {
  const formatted = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
    new Date(expiresAt)
  )
  const expiresBefore =
    earliestEventDate && new Date(expiresAt) < new Date(earliestEventDate)

  if (expiresBefore) {
    return (
      <div className='flex items-start gap-2 border-b py-2 text-amber-800 dark:text-amber-300'>
        <AlertTriangle className='mt-0.5 h-3.5 w-3.5 shrink-0' />
        <p className='text-xs'>
          Link expires <span className='font-medium'>{formatted}</span> — before your wedding.
          Generate a new link closer to the date.
        </p>
      </div>
    )
  }

  return (
    <p className='border-b py-2 text-muted-foreground text-xs'>
      Link expires <span className='font-medium'>{formatted}</span>
    </p>
  )
}

export default function SelfFillLinkManager() {
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)
  const [showRenewDialog, setShowRenewDialog] = useState(false)
  const [copied, setCopied] = useState(false)
  const utils = api.useUtils()

  const { data: tokenData, isLoading } = api.selfFill.getToken.useQuery()

  const url = tokenData?.token
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${tokenData.token}`
    : ''

  const generateMutation = api.selfFill.generateToken.useMutation({
    onSuccess: () => {
      toast.success('Invite link generated!')
      utils.selfFill.getToken.invalidate()
    },
    onError: () => toast.error('Failed to generate link'),
  })

  const renewMutation = api.selfFill.generateToken.useMutation({
    onSuccess: () => {
      toast.success('Invite link renewed!')
      setShowRenewDialog(false)
      utils.selfFill.getToken.invalidate()
    },
    onError: () => toast.error('Failed to renew link'),
  })

  const revokeMutation = api.selfFill.revokeToken.useMutation({
    onSuccess: () => {
      toast.success('Invite link disabled')
      setShowRevokeDialog(false)
      utils.selfFill.getToken.invalidate()
    },
    onError: () => toast.error('Failed to disable link'),
  })

  const handleCopy = async () => {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className='flex items-center gap-2 border-b py-3 text-muted-foreground text-sm'>
        <Loader2 className='h-3.5 w-3.5 animate-spin' />
      </div>
    )
  }

  return (
    <>
      <div className='flex items-center gap-3 border-b py-3 text-sm'>
        <Link2 className='h-3.5 w-3.5 shrink-0 text-muted-foreground' />

        {tokenData?.token ? (
          <>
            <span className='min-w-0 flex-1 truncate font-mono text-muted-foreground text-xs'>
              {url}
            </span>
            <button
              type='button'
              className='flex shrink-0 items-center gap-1 text-muted-foreground hover:text-foreground'
              onClick={handleCopy}
            >
              {copied ? <Check className='h-3.5 w-3.5' /> : <Copy className='h-3.5 w-3.5' />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <span className='text-border select-none'>·</span>
            <button
              type='button'
              className='flex shrink-0 items-center gap-1 text-muted-foreground hover:text-foreground'
              onClick={() => setShowRenewDialog(true)}
            >
              <RefreshCw className='h-3.5 w-3.5' />
              <span>Renew</span>
            </button>
            <span className='text-border select-none'>·</span>
            <button
              type='button'
              className='shrink-0 text-muted-foreground hover:text-destructive'
              onClick={() => setShowRevokeDialog(true)}
            >
              Disable
            </button>
          </>
        ) : (
          <>
            <span className='flex-1 text-muted-foreground'>
              Let guests add themselves to your list
            </span>
            <button
              type='button'
              className='flex shrink-0 items-center gap-1.5 text-primary hover:underline disabled:opacity-50'
              onClick={() => generateMutation.mutate({})}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending && <Loader2 className='h-3.5 w-3.5 animate-spin' />}
              {generateMutation.isPending ? 'Generating…' : 'Generate invite link →'}
            </button>
          </>
        )}
      </div>

      {tokenData?.token && tokenData.expiresAt && (
        <LinkExpiryNotice
          expiresAt={tokenData.expiresAt}
          earliestEventDate={tokenData.earliestEventDate ?? null}
        />
      )}

      <AlertDialog open={showRenewDialog} onOpenChange={setShowRenewDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renew Invite Link?</AlertDialogTitle>
            <AlertDialogDescription>
              This generates a new link and invalidates the current one. Anyone who has already
              received the old link won&apos;t be able to use it. Make sure to share the new link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={renewMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                renewMutation.mutate({})
              }}
              disabled={renewMutation.isPending}
              className='flex items-center gap-2'
            >
              {renewMutation.isPending && <Loader2 className='h-4 w-4 animate-spin' />}
              <RefreshCw className='h-4 w-4' />
              Renew Link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Invite Link?</AlertDialogTitle>
            <AlertDialogDescription>
              Anyone with the current link will no longer be able to add themselves. You can
              generate a new link at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                revokeMutation.mutate({})
              }}
              disabled={revokeMutation.isPending}
              className='flex items-center gap-2 bg-red-600 hover:bg-red-700'
            >
              {revokeMutation.isPending && <Loader2 className='h-4 w-4 animate-spin' />}
              <Trash2 className='h-4 w-4' />
              Disable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
