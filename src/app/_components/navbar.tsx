import { headers } from 'next/headers'
import Link from 'next/link'

import { SignInButton, SignOutButton } from '~/app/_components/auth-buttons'
import { ThemeToggle } from '~/app/_components/theme-toggle'
import { sharedStyles } from '~/app/utils/shared-styles'
import { auth } from '~/lib/auth'

export default async function Navbar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const userName = session?.user?.name ?? session?.user?.email?.split('@')[0] ?? ''

  return (
    <div className={`pt-5 ${sharedStyles.desktopPaddingSides} ${sharedStyles.minPageWidth}`}>
      <h1 className="pb-4 text-3xl">{userName}</h1>
      <ul className="flex justify-between">
        <div className="flex gap-7">
          <li className="border-b-4 border-transparent pb-5 hover:border-primary">
            <Link className="" href="/">
              Planning Tools
            </Link>
          </li>
          <li className="border-b-4 border-transparent pb-5 hover:border-primary">
            <Link href="/">Vendors</Link>
          </li>
          <li className="border-b-4 border-transparent pb-5 hover:border-primary">
            <Link href="/">Wedding Website</Link>
          </li>
          <li className="border-b-4 border-transparent pb-5 hover:border-primary">
            <Link href="/">Invitations</Link>
          </li>
          <li className="border-b-4 border-transparent pb-5 hover:border-primary">
            <Link href="/">Registry</Link>
          </li>
          <li className="border-b-4 border-transparent pb-5 hover:border-primary">
            <Link href="/">Attire & Rings</Link>
          </li>
          <li className="border-b-4 border-transparent pb-5 hover:border-primary">
            <Link href="/">Ideas & Advice</Link>
          </li>
          <li>
            <Link className="border-b-4 border-transparent pb-5 hover:border-primary" href="/">
              Gifts & Favors
            </Link>
          </li>
        </div>
        <div className="flex items-center gap-2 pb-5">
          <ThemeToggle />
          {!session ? <SignInButton /> : <SignOutButton />}
        </div>
      </ul>
      <hr className="relative -left-48 bottom-0 w-screen border-border" />
    </div>
  )
}
