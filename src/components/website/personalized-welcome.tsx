import { useTranslations } from 'next-intl'
import type { InvitedHousehold } from '~/app/w/[websiteSubUrl]/_lib/invited-household'

type PersonalizedWelcomeProps = {
  invitedHousehold: InvitedHousehold
}

/**
 * A slim, theme-aware banner shown to guests we recognise from their invite
 * link. It greets the household by name and sits above the template's home
 * surface, inheriting the template's colours and fonts via CSS variables, so it
 * stays visually consistent across every template without per-template code.
 */
export function PersonalizedWelcome({ invitedHousehold }: Readonly<PersonalizedWelcomeProps>) {
  const t = useTranslations('site.welcome')
  const labelFont = 'font-[family-name:var(--tpl-label-font,var(--tpl-body-font))]'

  return (
    <aside
      className='w-full border-border/60 border-b bg-primary/5 px-6 py-3 text-center'
      aria-label={t('label')}
    >
      <p className={`text-foreground/80 text-sm tracking-wide ${labelFont}`}>
        {t.rich('message', {
          greeting: invitedHousehold.greeting,
          count: invitedHousehold.guestFirstNames.length,
          name: (chunks) => <span className='font-medium text-foreground'>{chunks}</span>,
        })}
      </p>
    </aside>
  )
}
