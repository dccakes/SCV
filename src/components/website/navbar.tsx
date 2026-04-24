import Link from 'next/link'

const getNavLinks = (isRsvpEnabled: boolean) => {
  return [
    {
      title: 'Home',
      subPath: '/',
      isVisible: true,
    },
    {
      title: 'Our Story',
      subPath: '/our-story',
      isVisible: true,
    },
    {
      title: 'Wedding Party',
      subPath: '/wedding-party',
      isVisible: true,
    },
    {
      title: 'Photos',
      subPath: '/photos',
      isVisible: true,
    },
    {
      title: 'Q + A',
      subPath: '/q-a',
      isVisible: true,
    },
    {
      title: 'Travel',
      subPath: '/travel',
      isVisible: true,
    },
    {
      title: 'Things to Do',
      subPath: '/things-to-do',
      isVisible: true,
    },
    {
      title: 'Registry',
      subPath: '/registry',
      isVisible: true,
    },
    {
      title: 'RSVP',
      subPath: '/rsvp',
      isVisible: isRsvpEnabled,
    },
  ]
}

export default function Navbar({ path, isRsvpEnabled }: { path: string; isRsvpEnabled: boolean }) {
  return (
    <nav aria-label='Wedding website' className='mt-10 mb-5 w-full'>
      <ul className='flex w-full flex-col justify-center first:border-t sm:flex-row sm:gap-7 sm:border-none'>
        {getNavLinks(isRsvpEnabled)
          .filter((link) => link.isVisible)
          .map((link) => (
            <li
              key={link.subPath}
              className='border-b py-3 sm:border-transparent sm:border-b-2 sm:py-1 sm:hover:border-gray-600'
            >
              <Link href={`${path}${link.subPath === '/' ? '' : link.subPath}`}>{link.title}</Link>
            </li>
          ))}
      </ul>
    </nav>
  )
}
