import { render, screen } from '@testing-library/react'
import WeddingWebsiteLayout from '~/app/w/[websiteSubUrl]/layout'

jest.mock('next-intl', () => ({
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('next-intl/server', () => ({
  getLocale: jest.fn().mockResolvedValue('en'),
  getMessages: jest.fn().mockResolvedValue({}),
}))

jest.mock('~/components/locale-toggle', () => ({
  LocaleToggle: () => <button type='button'>Language</button>,
}))

it('does not show the unfinished locale toggle on wedding websites', async () => {
  render(await WeddingWebsiteLayout({ children: <div>Wedding website</div> }))

  expect(screen.getByText('Wedding website')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Language' })).toBeNull()
})
