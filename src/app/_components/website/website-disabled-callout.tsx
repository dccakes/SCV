import Link from 'next/link'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

export function WebsiteDisabledCallout() {
  return (
    <Card className='border-border/80 border-dashed bg-card/80'>
      <CardHeader className='space-y-3'>
        <p className='font-mono text-[0.62rem] text-foreground/45 uppercase tracking-[0.18em]'>
          Website Builder Disabled
        </p>
        <CardTitle className='font-serif text-3xl text-foreground'>
          Turn on the public wedding website plugin to start editing.
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-5'>
        <p className='max-w-2xl font-sans text-muted-foreground text-sm leading-6'>
          Once enabled, this workspace will get a dedicated wedding website editor and a shareable
          guest-facing URL.
        </p>
        <Button asChild>
          <Link href='/settings#plugins'>Open Plugins Settings</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
