'use client'

import { Link2 } from 'lucide-react'

import InviteLinkBanner from '~/app/_components/dashboard/invite-link-banner'
import { Card, CardContent } from '~/components/ui/card'
import { api } from '~/trpc/react'

/**
 * Dashboard sidebar card showing the active invite link with a copy button.
 * Renders nothing when no token exists — no generate action here.
 * Generate is done from the Guest List page.
 */
export default function InviteLinkCard() {
  const { data: tokenData } = api.selfFill.getToken.useQuery()

  if (!tokenData?.token) return null

  return (
    <Card className='border bg-card shadow-sm sm:col-span-3'>
      <CardContent className='p-6'>
        <div className='mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10'>
          <Link2 className='h-4 w-4 text-primary' />
        </div>
        <h2 className='mb-1 font-semibold text-foreground'>Invite Link Active</h2>
        <p className='mb-3 text-muted-foreground text-xs'>
          Share this link so guests can register themselves to your guest list.
        </p>
        <InviteLinkBanner />
      </CardContent>
    </Card>
  )
}
