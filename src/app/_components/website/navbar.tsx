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
    <div className="mb-5 mt-10 w-full">
      <ul className="flex w-full justify-center">
        <div className="flex w-full flex-col justify-center first:border-t sm:flex-row sm:gap-7 sm:border-none">
          {getNavLinks(isRsvpEnabled).map((link) => {
            return (
              link.isVisible && (
                <li className="border-b py-3 sm:border-b-2 sm:border-transparent sm:py-1 sm:hover:border-gray-600">
                  <Link className="" href={`${path}/${link.subPath}`}>
                    {link.title}
                  </Link>
                </li>
              )
            )
          })}
        </div>
      </ul>
    </div>
  )
}
