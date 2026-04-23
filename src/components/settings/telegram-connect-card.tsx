'use client'

import { Check, Link2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { api } from '~/trpc/react'

export function TelegramConnectCard() {
  const [pendingDeepLink, setPendingDeepLink] = useState<string | null>(null)

  const linkedChats = api.messaging.listLinkedChats.useQuery()

  const createPairingToken = api.messaging.createPairingToken.useMutation({
    onSuccess: (data) => {
      setPendingDeepLink(data.deepLink)
      if (typeof window !== 'undefined') {
        window.open(data.deepLink, '_blank', 'noopener,noreferrer')
      }
      toast.success('Open Telegram and tap Start to finish pairing.')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create pairing link')
    },
  })

  const revokeIdentity = api.messaging.revokeIdentity.useMutation({
    onSuccess: () => {
      void linkedChats.refetch()
      toast.success('Telegram chat unlinked')
    },
    onError: () => {
      toast.error('Failed to unlink Telegram chat')
    },
  })

  return (
    <div className='space-y-4 rounded-lg border border-border p-4'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h4 className='font-medium text-foreground'>Telegram</h4>
          <p className='mt-1 text-muted-foreground text-xs'>
            Message Etta from Telegram. Forward vendor quote PDFs and she&apos;ll extract the
            details. Approve changes from the web dashboard.
          </p>
        </div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => createPairingToken.mutate({ channel: 'telegram' })}
          disabled={createPairingToken.isPending}
        >
          <Link2 className='mr-2 h-3.5 w-3.5' aria-hidden='true' />
          Connect Telegram
        </Button>
      </div>

      {pendingDeepLink && (
        <div className='rounded-md border border-border bg-muted/40 p-3 text-xs'>
          <p className='flex items-center gap-1.5 text-foreground'>
            <Check className='h-3.5 w-3.5 text-green-600' aria-hidden='true' /> Pairing link opened
            in a new tab.
          </p>
          <p className='mt-1 text-muted-foreground'>
            Link expires in 15 minutes. Tap <strong>Start</strong> inside Telegram to finish.
          </p>
          <a
            href={pendingDeepLink}
            target='_blank'
            rel='noopener noreferrer'
            className='mt-1 block truncate font-mono text-[0.7rem] text-primary hover:underline'
          >
            {pendingDeepLink}
          </a>
        </div>
      )}

      <div className='space-y-2'>
        <p className='font-mono text-[0.62rem] text-foreground/55 uppercase tracking-wider'>
          Connected chats
        </p>
        {linkedChats.isLoading ? (
          <p className='text-muted-foreground text-xs'>Loading…</p>
        ) : linkedChats.data && linkedChats.data.length > 0 ? (
          <ul className='space-y-1'>
            {linkedChats.data.map((chat) => (
              <li
                key={chat.id}
                className='flex items-center justify-between rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-xs'
              >
                <div>
                  <p className='font-medium text-foreground'>
                    {chat.displayName ?? `Chat ${chat.externalChatId}`}
                  </p>
                  <p className='text-muted-foreground'>
                    Linked {new Date(chat.linkedAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => revokeIdentity.mutate({ identityId: chat.id })}
                  disabled={revokeIdentity.isPending}
                  aria-label={`Unlink ${chat.displayName ?? chat.externalChatId}`}
                  className='text-destructive hover:text-destructive'
                >
                  <Trash2 className='h-3.5 w-3.5' aria-hidden='true' />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className='text-muted-foreground text-xs'>No Telegram chats linked yet.</p>
        )}
      </div>
    </div>
  )
}
