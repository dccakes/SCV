'use client'

import { Copy, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { api } from '~/trpc/react'

type WhatsAppNumberInfo = {
  phoneNumber: string
}

type WhatsAppNumberCardProps = {
  number: WhatsAppNumberInfo | null
  isLoading: boolean
  onAssigned: () => void
}

export function WhatsAppNumberCard(props: Readonly<WhatsAppNumberCardProps>) {
  const assign = api.messaging.assignWhatsAppNumber.useMutation({
    onSuccess: (data) => {
      toast.success(`Your wedding's WhatsApp number is ${data.phoneNumber}`)
      props.onAssigned()
    },
    onError: (error) => toast.error(error.message || 'Failed to claim a number'),
  })

  const copyNumber = async () => {
    if (!props.number) return
    await navigator.clipboard.writeText(props.number.phoneNumber)
    toast.success('Number copied')
  }

  return (
    <div className='space-y-3 rounded-lg border border-border p-4'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h4 className='font-medium text-foreground'>Your wedding&apos;s WhatsApp number</h4>
          <p className='mt-1 text-muted-foreground text-xs'>
            Guests text this number to ask Etta about the schedule, get their invite link, RSVP, and
            more. Add it to your invitations and save-the-dates.
          </p>
        </div>
        {!props.isLoading && !props.number && (
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => assign.mutate()}
            disabled={assign.isPending}
          >
            <MessageCircle className='mr-2 h-3.5 w-3.5' aria-hidden='true' />
            {assign.isPending ? 'Claiming…' : 'Claim a number'}
          </Button>
        )}
      </div>

      {props.isLoading ? (
        <p className='text-muted-foreground text-xs'>Loading…</p>
      ) : props.number ? (
        <div className='flex items-center gap-2'>
          <span className='rounded-md border border-border/50 bg-muted/20 px-3 py-2 font-mono text-foreground text-sm'>
            {props.number.phoneNumber}
          </span>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={copyNumber}
            aria-label='Copy WhatsApp number'
          >
            <Copy className='h-3.5 w-3.5' aria-hidden='true' />
          </Button>
        </div>
      ) : (
        <p className='text-muted-foreground text-xs'>
          No number claimed yet. Claim one so guests can start texting Etta.
        </p>
      )}
    </div>
  )
}
