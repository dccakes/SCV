'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { BroadcastComposer } from '~/components/messaging/broadcast-composer'
import { ConversationThread } from '~/components/messaging/conversation-thread'
import { WhatsAppNumberCard } from '~/components/messaging/whatsapp-number-card'
import { api } from '~/trpc/react'

function householdLabel(conversation: {
  displayName: string | null
  externalChatId: string
  household: {
    guests: Array<{ firstName: string; lastName: string; isPrimaryContact: boolean }>
  } | null
}): string {
  const guests = conversation.household?.guests ?? []
  if (guests.length > 0) {
    const primary = guests.find((guest) => guest.isPrimaryContact) ?? guests[0]
    const others = guests.length - 1
    const name = `${primary?.firstName ?? ''} ${primary?.lastName ?? ''}`.trim()
    if (name) return others > 0 ? `${name} +${others}` : name
  }
  return conversation.displayName ?? conversation.externalChatId
}

export function GuestMessagingPanel() {
  const [selectedIdentityId, setSelectedIdentityId] = useState<string | null>(null)

  const status = api.messaging.getWhatsAppStatus.useQuery()
  const conversations = api.messaging.listConversations.useQuery()

  const broadcast = api.messaging.broadcastUpdate.useMutation({
    onSuccess: (result) => {
      const parts = [`Sent to ${result.sent} household${result.sent === 1 ? '' : 's'}`]
      if (result.failed > 0) parts.push(`${result.failed} failed`)
      if (result.unreachableHouseholds > 0) {
        parts.push(`${result.unreachableHouseholds} without a phone`)
      }
      toast.success(parts.join(' · '))
      void conversations.refetch()
    },
    onError: (error) => toast.error(error.message || 'Failed to send update'),
  })

  const hasNumber = Boolean(status.data?.number)

  return (
    <div className='space-y-6'>
      <WhatsAppNumberCard
        number={status.data?.number ?? null}
        isLoading={status.isLoading}
        onAssigned={() => {
          void status.refetch()
        }}
      />

      {hasNumber && (
        <BroadcastComposer
          isSending={broadcast.isPending}
          onSend={(message) => broadcast.mutate({ message })}
        />
      )}

      {hasNumber && (
        <div className='space-y-4 rounded-lg border border-border p-4'>
          <div>
            <h4 className='font-medium text-foreground'>Household conversations</h4>
            <p className='mt-1 text-muted-foreground text-xs'>
              Every household that texts Etta gets its own thread. Reply here to message them
              directly.
            </p>
          </div>

          {conversations.isLoading ? (
            <p className='text-muted-foreground text-xs'>Loading…</p>
          ) : conversations.data && conversations.data.length > 0 ? (
            <div className='grid gap-4 md:grid-cols-[220px_1fr]'>
              <ul className='space-y-1'>
                {conversations.data.map((conversation) => {
                  const lastMessage = conversation.messages[0]
                  const isSelected = conversation.id === selectedIdentityId
                  return (
                    <li key={conversation.id}>
                      <button
                        type='button'
                        onClick={() => setSelectedIdentityId(conversation.id)}
                        className={`w-full rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border/50 bg-muted/20 hover:bg-muted/40'
                        }`}
                      >
                        <p className='font-medium text-foreground'>
                          {householdLabel(conversation)}
                        </p>
                        {lastMessage && (
                          <p className='mt-0.5 line-clamp-1 text-muted-foreground'>
                            {lastMessage.content}
                          </p>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
              {selectedIdentityId ? (
                <ConversationThread
                  identityId={selectedIdentityId}
                  householdId={
                    conversations.data.find((c) => c.id === selectedIdentityId)?.householdId ?? null
                  }
                />
              ) : (
                <p className='self-center text-center text-muted-foreground text-xs'>
                  Select a conversation to read it.
                </p>
              )}
            </div>
          ) : (
            <p className='text-muted-foreground text-xs'>
              No conversations yet. Share the number above with your guests so they can text Etta.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
