import { headers } from 'next/headers'

import { SignOutButton } from '~/app/_components/auth-buttons'
import { ThemeToggle } from '~/app/_components/theme-toggle'
import { sharedStyles } from '~/app/utils/shared-styles'
import { auth } from '~/lib/auth'

import NavLinks from './nav-links'

export default async function Navbar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const userName = session?.user?.name ?? session?.user?.email?.split('@')[0] ?? ''

  return (
    <nav
      className={`sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60`}
    >
      <div className={`flex h-14 items-center justify-between ${sharedStyles.desktopPaddingSides}`}>
        <div className="flex items-center gap-8">
          <span className="font-serif text-lg font-semibold tracking-wide text-primary">OSWP</span>
          <NavLinks />
        </div>
        <div className="flex items-center gap-2">
          {userName && (
            <span className="hidden text-sm text-muted-foreground md:block">{userName}</span>
          )}
          <ThemeToggle />
          {session ? <SignOutButton /> : null}
        </div>
      </div>
    </nav>
  )
}
