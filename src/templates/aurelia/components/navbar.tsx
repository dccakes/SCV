import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { LocaleToggle } from '~/components/locale-toggle'

type AureliaNavbarProps = {
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

export function AureliaNavbar({ path, isRsvpEnabled }: Readonly<AureliaNavbarProps>) {
  const t = useTranslations('templateShared.nav')

  return (
    <nav aria-label={t('ariaLabel')} className='w-full'>
      <ul className='flex flex-col items-center justify-center gap-1 text-[0.72rem] uppercase tracking-[0.32em] sm:flex-row sm:gap-9'>
        {getNavLinks(isRsvpEnabled)
          .filter((link) => link.isVisible)
          .map((link) => (
            <li key={link.subPath || 'home'} className='py-2'>
              <Link
                href={`${path}${link.subPath}`}
                className='border-transparent border-b pb-1 text-muted-foreground transition-colors hover:border-primary hover:text-primary'
              >
                {t(link.key)}
              </Link>
            </li>
          ))}
        <li className='py-2'>
          <LocaleToggle className='text-[0.68rem] text-muted-foreground uppercase tracking-[0.32em] transition-colors hover:text-primary' />
        </li>
      </ul>
    </nav>
  )
}
