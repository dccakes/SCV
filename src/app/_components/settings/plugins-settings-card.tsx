'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Card, CardContent } from '~/components/ui/card'
import { Switch } from '~/components/ui/switch'
import { api } from '~/trpc/react'

type PluginsSettingsCardProps = Readonly<{
  enabledAddOns: string[]
}>

export function PluginsSettingsCard({ enabledAddOns }: PluginsSettingsCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isEnabled, setIsEnabled] = useState(enabledAddOns.includes('website_builder'))

  const toggleAddOn = api.wedding.toggleAddOn.useMutation({
    onError: () => {
      setIsEnabled((current) => !current)
      toast.error('Unable to update the Public Wedding Website plugin.')
    },
    onSuccess: (updatedWedding) => {
      setIsEnabled(updatedWedding.enabledAddOns.includes('website_builder'))
      startTransition(() => {
        router.refresh()
      })
    },
  })

  const handleCheckedChange = (checked: boolean) => {
    setIsEnabled(checked)
    toggleAddOn.mutate({
      addOn: 'website_builder',
      enabled: checked,
    })
  }

  return (
    <Card className='border-border/80 bg-card/80'>
      <CardContent className='p-0'>
        <div className='flex items-start justify-between gap-4 px-6 py-5'>
          <div className='space-y-1.5'>
            <p className='font-mono text-[0.62rem] text-foreground/45 uppercase tracking-[0.18em]'>
              Public Wedding Website
            </p>
            <h4 className='font-serif text-foreground text-lg'>Share a guest-facing website</h4>
            <p className='max-w-xl font-sans text-muted-foreground text-sm leading-6'>
              Enable the wedding website builder, unlock the `/website` editor, and publish a
              shareable page for your guests. RSVP remains available separately.
            </p>
          </div>
          <Switch
            aria-label='Toggle Public Wedding Website plugin'
            checked={isEnabled}
            disabled={toggleAddOn.isPending || isPending}
            onCheckedChange={handleCheckedChange}
          />
        </div>
      </CardContent>
    </Card>
  )
}
