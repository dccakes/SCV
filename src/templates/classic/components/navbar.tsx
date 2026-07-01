import Link from 'next/link'

type ClassicNavbarProps = {
  path: string
  isRsvpEnabled: boolean
}

const getNavLinks = (isRsvpEnabled: boolean) => [
  { title: 'Home', subPath: '', isVisible: true },
  // Guests get their save-the-date from the personalized household invite link
  // (/w/[subUrl]/invite), which stays current as details change — so we don't
  // surface the generic website save-the-date page as a second destination.
  { title: 'Save the Date', subPath: '/save-the-date', isVisible: false },
  { title: 'Invitation', subPath: '/invitation', isVisible: true },
  { title: 'RSVP', subPath: '/rsvp', isVisible: isRsvpEnabled },
]

export function ClassicNavbar({ path, isRsvpEnabled }: Readonly<ClassicNavbarProps>) {
  return (
    <nav aria-label='Wedding website' className='mt-10 mb-5 w-full'>
      <ul className='flex w-full flex-col justify-center first:border-t sm:flex-row sm:gap-7 sm:border-none'>
        {getNavLinks(isRsvpEnabled)
          .filter((link) => link.isVisible)
          .map((link) => (
            <li
              key={link.subPath || 'home'}
              className='border-b py-3 sm:border-transparent sm:border-b-2 sm:py-1 sm:hover:border-gray-600'
            >
              <Link href={`${path}${link.subPath}`}>{link.title}</Link>
            </li>
          ))}
      </ul>
    </nav>
  )
}
