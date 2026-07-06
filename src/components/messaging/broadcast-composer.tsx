'use client'

import { Send } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'

type BroadcastComposerProps = {
  isSending: boolean
  onSend: (message: string) => void
}

export function BroadcastComposer(props: Readonly<BroadcastComposerProps>) {
  const [message, setMessage] = useState('')

  const handleSend = () => {
    const trimmed = message.trim()
    if (!trimmed) return
    props.onSend(trimmed)
    setMessage('')
  }

  return (
    <div className='space-y-3 rounded-lg border border-border p-4'>
      <div>
        <h4 className='font-medium text-foreground'>Send an update to all households</h4>
        <p className='mt-1 text-muted-foreground text-xs'>
          One WhatsApp message per household — it lands in their conversation with Etta, so
          follow-up questions get answered automatically. You can also ask Etta to draft a blast for
          you.
        </p>
      </div>
      <Textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder='e.g. Quick update: the ceremony now starts at 4pm — same venue!'
        rows={3}
        maxLength={1600}
        disabled={props.isSending}
      />
      <div className='flex justify-end'>
        <Button
          type='button'
          size='sm'
          onClick={handleSend}
          disabled={props.isSending || message.trim().length === 0}
        >
          <Send className='mr-2 h-3.5 w-3.5' aria-hidden='true' />
          {props.isSending ? 'Sending…' : 'Send to all households'}
        </Button>
      </div>
    </div>
  )
}
