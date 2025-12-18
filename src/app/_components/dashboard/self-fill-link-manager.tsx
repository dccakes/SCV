'use client'

import { Check, Copy, Link2, Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { sharedStyles } from '~/app/utils/shared-styles'
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
import { Button } from '~/components/ui/button'
import { api } from '~/trpc/react'

export default function SelfFillLinkManager() {
  const router = useRouter()
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)
  const [copied, setCopied] = useState(false)

  const { data: tokenData, isLoading } = api.selfFill.getToken.useQuery()

  const generateMutation = api.selfFill.generateToken.useMutation({
    onSuccess: () => {
      toast.success('Self-fill link generated!')
      router.refresh()
    },
    onError: () => {
      toast.error('Failed to generate link')
    },
  })

  const revokeMutation = api.selfFill.revokeToken.useMutation({
    onSuccess: () => {
      toast.success('Self-fill link disabled')
      setShowRevokeDialog(false)
      router.refresh()
    },
    onError: () => {
      toast.error('Failed to disable link')
    },
  })

  const getSelfFillUrl = () => {
    if (!tokenData?.token) return ''
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/join/${tokenData.token}`
  }

  const handleCopy = async () => {
    const url = getSelfFillUrl()
    if (url) {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="border-b py-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Self-Fill Link</h2>
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="border-b py-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Self-Fill Link</h2>
          {tokenData?.token ? (
            <span
              className={`text-${sharedStyles.primaryColor} cursor-pointer text-lg hover:underline`}
              onClick={() => setShowRevokeDialog(true)}
            >
              Disable
            </span>
          ) : (
            <span
              className={`text-${sharedStyles.primaryColor} cursor-pointer text-lg hover:underline`}
              onClick={() => generateMutation.mutate({})}
            >
              {generateMutation.isPending ? 'Generating...' : 'Generate'}
            </span>
          )}
        </div>

        <p className="mb-3 text-sm text-muted-foreground">
          {tokenData?.token
            ? 'Share this link with guests so they can add themselves to your guest list.'
            : 'Generate a link that guests can use to add themselves to your guest list.'}
        </p>

        {tokenData?.token && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleCopy}
              disabled={copied}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(getSelfFillUrl(), '_blank')}
            >
              <Link2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Self-Fill Link?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disable the current self-fill link. Anyone with the old link will no longer
              be able to add themselves to your guest list. You can generate a new link at any time.
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
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
            >
              {revokeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Trash2 className="h-4 w-4" />
              Disable Link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
