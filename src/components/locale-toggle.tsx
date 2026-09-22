'use client'

import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

export function LocaleToggle() {
  const locale = useLocale()
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
      className='font-mono text-muted-foreground text-xs uppercase tracking-[0.22em] hover:text-foreground'
      aria-label={`Switch to ${switchTo === 'en' ? 'English' : 'Spanish'}`}
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
