import Link from 'next/link'
import { type Dispatch, type SetStateAction } from 'react'
import { Lock, Palette, Store, Users } from 'lucide-react'

import { Card, CardContent } from '~/components/ui/card'

type SidebarPanelProps = {
  setShowWebsiteSettings: Dispatch<SetStateAction<boolean>>
}

export default function SidebarPanel({ setShowWebsiteSettings }: SidebarPanelProps) {
  return (
    <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card className="border bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Palette className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-semibold text-foreground">Your Theme</h2>
          <p className="mt-1 text-xs text-muted-foreground">Customise your website appearance</p>
          <button className="mt-3 text-sm text-primary hover:underline">Browse Themes →</button>
        </CardContent>
      </Card>

      <Card className="border bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-semibold text-foreground">Guest List</h2>
          <p className="mt-1 text-xs text-muted-foreground">Manage households and RSVPs</p>
          <Link href="/guest-list" className="mt-3 block text-sm text-primary hover:underline">
            Manage →
          </Link>
        </CardContent>
      </Card>

      <Card className="border bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Store className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-semibold text-foreground">Vendors</h2>
          <p className="mt-1 text-xs text-muted-foreground">Track quotes and vendor selection</p>
          <Link href="/vendors" className="mt-3 block text-sm text-primary hover:underline">
            Manage →
          </Link>
        </CardContent>
      </Card>

      <Card className="border bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Lock className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-semibold text-foreground">Privacy Settings</h2>
          <p className="mt-1 text-xs text-muted-foreground">Control website access</p>
          <button
            className="mt-3 text-sm text-primary hover:underline"
            onClick={() => setShowWebsiteSettings(true)}
          >
            Manage →
          </button>
        </CardContent>
      </Card>
    </section>
  )
}
