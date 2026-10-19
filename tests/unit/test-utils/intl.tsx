import { type RenderOptions, render } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactElement, ReactNode } from 'react'
import enSite from '~/i18n/messages/en/site.json'
import enTemplates from '~/i18n/messages/en/templates.json'
import enVoyage from '~/i18n/messages/en/voyage.json'
import enCore from '~/i18n/messages/en.json'
import esSite from '~/i18n/messages/es/site.json'
import esTemplates from '~/i18n/messages/es/templates.json'
import esVoyage from '~/i18n/messages/es/voyage.json'
import esCore from '~/i18n/messages/es.json'

export const testMessages = {
  en: { ...enCore, ...enSite, ...enVoyage, ...enTemplates },
  es: { ...esCore, ...esSite, ...esVoyage, ...esTemplates },
}

export function IntlWrapper({
  children,
  locale = 'en',
}: Readonly<{ children: ReactNode; locale?: 'en' | 'es' }>) {
  return (
    <NextIntlClientProvider locale={locale} messages={testMessages[locale]} timeZone='UTC'>
      {children}
    </NextIntlClientProvider>
  )
}

/** Render inside a next-intl provider, the way the wedding-site layout does. */
export function renderWithIntl(
  ui: ReactElement,
  { locale = 'en', ...options }: RenderOptions & { locale?: 'en' | 'es' } = {}
) {
  const result = render(ui, {
    wrapper: ({ children }) => <IntlWrapper locale={locale}>{children}</IntlWrapper>,
    ...options,
  })
  return {
    ...result,
    rerender: (next: ReactElement) =>
      result.rerender(<IntlWrapper locale={locale}>{next}</IntlWrapper>),
  }
}
