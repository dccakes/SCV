'use client'

import { Send } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { api } from '~/trpc/react'

type ConversationThreadProps = {
  identityId: string
  householdId: string | null
}

export function ConversationThread(props: Readonly<ConversationThreadProps>) {
  const [reply, setReply] = useState('')

  const messages = api.messaging.getConversation.useQuery({ identityId: props.identityId })

  const sendMessage = api.messaging.sendHouseholdMessage.useMutation({
    onSuccess: () => {
      setReply('')
      void messages.refetch()
      toast.success('Message sent')
    },
    onError: (error) => toast.error(error.message || 'Failed to send message'),
  })

  const handleSend = () => {
    const trimmed = reply.trim()
    if (!trimmed || !props.householdId) return
    sendMessage.mutate({ householdId: props.householdId, message: trimmed })
  }

  return (
    <div className='flex min-h-[16rem] flex-col rounded-md border border-border/50'>
      <div className='max-h-96 flex-1 space-y-2 overflow-y-auto p-3'>
        {messages.isLoading ? (
          <p className='text-muted-foreground text-xs'>Loading…</p>
        ) : messages.data && messages.data.length > 0 ? (
          messages.data.map((message) => (
            <div
              key={message.id}
              className={`max-w-[85%] rounded-md px-3 py-2 text-xs ${
                message.role === 'user'
                  ? 'bg-muted/40 text-foreground'
                  : 'ml-auto bg-primary/10 text-foreground'
              }`}
            >
              <p className='whitespace-pre-wrap'>{message.content}</p>
              <p className='mt-1 text-[0.62rem] text-muted-foreground'>
                {message.role === 'user' ? 'Guest' : 'Etta / You'} ·{' '}
                {new Date(message.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <p className='text-muted-foreground text-xs'>No messages yet.</p>
        )}
      </div>
      <div className='flex items-end gap-2 border-border/50 border-t p-3'>
        <Textarea
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          placeholder='Message this household over WhatsApp…'
          rows={2}
          maxLength={1600}
          disabled={sendMessage.isPending || !props.householdId}
          className='flex-1'
        />
        <Button
          type='button'
          size='sm'
          onClick={handleSend}
          disabled={sendMessage.isPending || reply.trim().length === 0 || !props.householdId}
          aria-label='Send message'
        >
          <Send className='h-3.5 w-3.5' aria-hidden='true' />
        </Button>
      </div>
    </div>
  )
}
