'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Guest List', href: '/guest-list' },
  { label: 'Events', href: '/events' },
  { label: 'Vendors', href: '/vendors' },
]

export default function NavLinks() {
  const pathname = usePathname()

  return (
    <ul className='flex items-center gap-6'>
      {NAV_LINKS.map((link) => {
        const isActive = pathname.startsWith(link.href)
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`border-b-2 pb-0.5 font-medium text-sm transition-colors ${
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
