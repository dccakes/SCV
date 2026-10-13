import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { LocaleToggle } from '~/components/locale-toggle'

type ClassicNavbarProps = {
  path: string
  isRsvpEnabled: boolean
}

type NavKey = 'home' | 'saveTheDate' | 'invitation' | 'rsvp'

const getNavLinks = (
  isRsvpEnabled: boolean
): { key: NavKey; subPath: string; isVisible: boolean }[] => [
  { key: 'home', subPath: '', isVisible: true },
  // Guests reach their personalized save-the-date through their household link
  // (/w/[subUrl]/save-the-date/[token]), which sets a cookie and stays current as
  // details change. A token-less nav entry would only hit the invalid state, so
  // we keep this destination hidden from the public nav.
  { key: 'saveTheDate', subPath: '/save-the-date', isVisible: false },
  { key: 'invitation', subPath: '/invitation', isVisible: true },
  { key: 'rsvp', subPath: '/rsvp', isVisible: isRsvpEnabled },
]

export function ClassicNavbar({ path, isRsvpEnabled }: Readonly<ClassicNavbarProps>) {
  const t = useTranslations('templateShared.nav')

  return (
    <nav aria-label={t('ariaLabel')} className='mt-10 mb-5 w-full'>
      <ul className='flex w-full flex-col justify-center first:border-t sm:flex-row sm:gap-7 sm:border-none'>
        {getNavLinks(isRsvpEnabled)
          .filter((link) => link.isVisible)
          .map((link) => (
            <li
              key={link.subPath || 'home'}
              className='border-b py-3 sm:border-transparent sm:border-b-2 sm:py-1 sm:hover:border-gray-600'
            >
              <Link href={`${path}${link.subPath}`}>{t(link.key)}</Link>
            </li>
          ))}
        <li className='py-3 sm:py-1'>
          <LocaleToggle className='text-xs text-zinc-400 uppercase tracking-[0.22em] hover:text-zinc-700' />
        </li>
      </ul>
    </nav>
  )
}
