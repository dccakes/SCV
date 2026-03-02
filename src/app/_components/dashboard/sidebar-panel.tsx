import { Link2, Lock, Palette, Users } from 'lucide-react'
import Link from 'next/link'
import type { Dispatch, SetStateAction } from 'react'

import SelfFillLinkManager from '~/app/_components/dashboard/self-fill-link-manager'
import { Card, CardContent } from '~/components/ui/card'

type SidebarPanelProps = {
  setShowWebsiteSettings: Dispatch<SetStateAction<boolean>>
}

export default function SidebarPanel({ setShowWebsiteSettings }: SidebarPanelProps) {
  return (
    <section className='mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3'>
      <Card className='border bg-card shadow-sm'>
        <CardContent className='p-6'>
          <div className='mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10'>
            <Palette className='h-4 w-4 text-primary' />
          </div>
          <h2 className='font-semibold text-foreground'>Your Theme</h2>
          <p className='mt-1 text-muted-foreground text-xs'>Customise your website appearance</p>
          <button type='button' className='mt-3 text-primary text-sm hover:underline'>
            Browse Themes →
          </button>
        </CardContent>
      </Card>

      <Card className='border bg-card shadow-sm'>
        <CardContent className='p-6'>
          <div className='mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10'>
            <Users className='h-4 w-4 text-primary' />
          </div>
          <h2 className='font-semibold text-foreground'>Guest List</h2>
          <p className='mt-1 text-muted-foreground text-xs'>Manage households and RSVPs</p>
          <Link href='/guest-list' className='mt-3 block text-primary text-sm hover:underline'>
            Manage →
          </Link>
        </CardContent>
      </Card>

      <Card className='border bg-card shadow-sm'>
        <CardContent className='p-6'>
          <div className='mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10'>
            <Lock className='h-4 w-4 text-primary' />
          </div>
          <h2 className='font-semibold text-foreground'>Privacy Settings</h2>
          <p className='mt-1 text-muted-foreground text-xs'>Control website access</p>
          <button
            type='button'
            className='mt-3 text-primary text-sm hover:underline'
            onClick={() => setShowWebsiteSettings(true)}
          >
            Manage →
          </button>
        </CardContent>
      </Card>

      <Card className='border bg-card shadow-sm sm:col-span-3'>
        <CardContent className='p-6'>
          <div className='mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10'>
            <Link2 className='h-4 w-4 text-primary' />
          </div>
          <SelfFillLinkManager />
        </CardContent>
      </Card>
    </section>
  )
}
