'use client'

import { CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'
import { api } from '~/trpc/react'

type RsvpToggleCardProps = Readonly<{
  websiteId: string
  initialIsRsvpEnabled: boolean
}>

export function RsvpToggleCard({ websiteId, initialIsRsvpEnabled }: RsvpToggleCardProps) {
  const router = useRouter()
  const [isRsvpEnabled, setIsRsvpEnabled] = useState(initialIsRsvpEnabled)

  const updateIsRsvpEnabled = api.website.updateIsRsvpEnabled.useMutation({
    onSuccess: () => {
      toast.success(
        isRsvpEnabled ? 'RSVPs are now being accepted' : 'RSVPs are now disabled'
      )
      router.refresh()
    },
    onError: (error) => {
      setIsRsvpEnabled(!isRsvpEnabled)
      toast.error('Could not update RSVP setting', {
        description: error.message ?? 'Please try again later.',
      })
    },
  })

  const isSaving = updateIsRsvpEnabled.isPending

  const handleToggle = (checked: boolean) => {
    setIsRsvpEnabled(checked)
    updateIsRsvpEnabled.mutate({
      websiteId,
      isRsvpEnabled: checked,
    })
  }

  return (
    <Card className='border-border/80 bg-card/80'>
      <CardHeader className='space-y-3'>
        <p className='font-mono text-[0.62rem] text-foreground/45 uppercase tracking-[0.18em]'>
          Guest Responses
        </p>
        <CardTitle className='flex items-center gap-2 font-serif text-2xl text-foreground'>
          <CheckCircle aria-hidden='true' className='h-5 w-5' />
          RSVP buttons
        </CardTitle>
        <p className='max-w-2xl font-sans text-muted-foreground text-sm leading-6'>
          Allow guests to submit RSVPs. When disabled, RSVP buttons remain visible on your templates
          but guests will see a message that you&apos;re not yet accepting responses.
        </p>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='flex items-center justify-between gap-4'>
          <Label htmlFor='rsvp-toggle' className='font-medium text-foreground text-sm'>
            Enable RSVP buttons
          </Label>
          <Switch
            id='rsvp-toggle'
            checked={isRsvpEnabled}
            disabled={isSaving}
            onCheckedChange={handleToggle}
          />
        </div>

        <p className='font-sans text-muted-foreground text-sm'>
          {isRsvpEnabled
            ? 'Guests can submit RSVPs on your website and invitations.'
            : 'Guests will see RSVP buttons but cannot submit responses yet.'}
        </p>
      </CardContent>
    </Card>
  )
}
