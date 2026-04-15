import { fireEvent, render, screen, within } from '@testing-library/react'

import NonAuthenticatedView from '~/components/home/non-authenticated-view'

jest.mock('~/components/auth-buttons', () => ({
  SignInButton: () => <a href='/auth/signin'>Sign In</a>,
}))

describe('NonAuthenticatedView mobile nav', () => {
  it('shows a mobile navigation trigger and exposes parity links', () => {
    render(<NonAuthenticatedView />)

    const trigger = screen.getByRole('button', { name: /open navigation menu/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const menuDialog = screen.getByRole('dialog', { name: /mobile navigation menu/i })

    expect(within(menuDialog).getByRole('link', { name: 'Features' })).toBeInTheDocument()
    expect(within(menuDialog).getByRole('link', { name: 'Etta AI' })).toBeInTheDocument()
    expect(within(menuDialog).getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog')
    expect(within(menuDialog).getByRole('link', { name: 'Pricing' })).toBeInTheDocument()
    expect(within(menuDialog).getByRole('link', { name: /GitHub/i })).toBeInTheDocument()
  })

  it('includes footer blog and changelog links', () => {
    render(<NonAuthenticatedView />)
    const footer = screen.getByRole('contentinfo')

    expect(within(footer).getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog')
    expect(within(footer).getByRole('link', { name: 'Changelog' })).toHaveAttribute(
      'href',
      '/blog?tag=changelog'
    )
  })

  it('supports keyboard close with focus return to trigger', () => {
    render(<NonAuthenticatedView />)

    const trigger = screen.getByRole('button', { name: /open navigation menu/i })
    fireEvent.click(trigger)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
  })
})
