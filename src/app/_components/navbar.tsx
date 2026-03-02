import { headers } from 'next/headers'
import Link from 'next/link'

import { SignOutButton } from '~/app/_components/auth-buttons'
import NavLinks from '~/app/_components/nav-links'
import { ThemeToggle } from '~/app/_components/theme-toggle'
import { sharedStyles } from '~/app/utils/shared-styles'
import { auth } from '~/lib/auth'

export default async function Navbar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const userName = session?.user?.name ?? session?.user?.email?.split('@')[0] ?? ''

  return (
    <nav
      className={`sticky top-0 z-40 w-full border-border border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60`}
    >
      <div className={`flex h-14 items-center justify-between ${sharedStyles.desktopPaddingSides}`}>
        <div className='flex items-center gap-8'>
          <Link href='/' className='font-semibold font-serif text-lg text-primary tracking-wide'>
            OSWP
          </Link>
          <NavLinks />
        </div>
        <div className='flex items-center gap-2'>
          {userName && (
            <span className='hidden text-muted-foreground text-sm md:block'>{userName}</span>
          )}
          <ThemeToggle />
          {session ? <SignOutButton /> : null}
        </div>
      </div>
    </nav>
  )
}
