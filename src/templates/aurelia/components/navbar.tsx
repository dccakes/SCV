import Link from 'next/link'

type AureliaNavbarProps = {
  path: string
  isRsvpEnabled: boolean
}

const getNavLinks = (isRsvpEnabled: boolean) => [
  { title: 'Home', subPath: '', isVisible: true },
  { title: 'Save the Date', subPath: '/save-the-date', isVisible: true },
  { title: 'Invitation', subPath: '/invitation', isVisible: true },
  { title: 'RSVP', subPath: '/rsvp', isVisible: isRsvpEnabled },
]

export function AureliaNavbar({ path, isRsvpEnabled }: Readonly<AureliaNavbarProps>) {
  return (
    <nav aria-label='Wedding website' className='w-full'>
      <ul className='flex flex-col items-center justify-center gap-1 text-[0.72rem] uppercase tracking-[0.32em] sm:flex-row sm:gap-9'>
        {getNavLinks(isRsvpEnabled)
          .filter((link) => link.isVisible)
          .map((link) => (
            <li key={link.subPath || 'home'} className='py-2'>
              <Link
                href={`${path}${link.subPath}`}
                className='border-transparent border-b pb-1 text-muted-foreground transition-colors hover:border-primary hover:text-primary'
              >
                {link.title}
              </Link>
            </li>
          ))}
      </ul>
    </nav>
  )
}
