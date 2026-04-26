'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { api } from '~/trpc/react'

export function WebsiteSetupCallout() {
  const router = useRouter()
  const createWebsite = api.website.create.useMutation({
    onError: () => {
      toast.error('Unable to create your wedding website.')
    },
    onSuccess: () => {
      toast.success('Wedding website created')
      router.refresh()
    },
  })

  return (
    <Card className='border-border/80 bg-card/80'>
      <CardHeader className='space-y-3'>
        <p className='font-mono text-[0.62rem] text-foreground/45 uppercase tracking-[0.18em]'>
          Website Builder Ready
        </p>
        <CardTitle className='font-serif text-3xl text-foreground'>
          Create the guest-facing website before you start editing sections.
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-5'>
        <p className='max-w-2xl font-sans text-muted-foreground text-sm leading-6'>
          This provisions your public wedding URL and the default HOME section. After that, the
          editor opens here and guests can view the site at the generated `/w/...` link.
        </p>
        <Button disabled={createWebsite.isPending} onClick={() => createWebsite.mutate({})}>
          {createWebsite.isPending ? 'Creating…' : 'Create Website'}
        </Button>
      </CardContent>
    </Card>
  )
}
