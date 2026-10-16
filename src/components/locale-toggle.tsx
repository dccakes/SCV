'use client'

import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

export function LocaleToggle({ className }: Readonly<{ className?: string }> = {}) {
  const locale = useLocale()
  const t = useTranslations('site.localeToggle')
  const router = useRouter()

  const switchTo = locale === 'en' ? 'es' : 'en'

  const handleSwitch = async () => {
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: switchTo }),
    })
    router.refresh()
  }

  return (
    <button
      type='button'
      onClick={handleSwitch}
      className={
        className ??
        'font-mono text-muted-foreground text-xs uppercase tracking-[0.22em] hover:text-foreground'
      }
      // The label is written in the target language, so tag it for screen readers.
      lang={switchTo}
      aria-label={switchTo === 'en' ? t('switchToEnglish') : t('switchToSpanish')}
    >
      {locale === 'en' ? (
        <>
          <span className='text-foreground'>EN</span>
          <span className='mx-1'>|</span>
          <span>ES</span>
        </>
      ) : (
        <>
          <span>EN</span>
          <span className='mx-1'>|</span>
          <span className='text-foreground'>ES</span>
        </>
      )}
    </button>
  )
}
