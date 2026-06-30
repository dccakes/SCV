import { render, screen } from '@testing-library/react'

import { EnvelopeReveal } from '~/components/website/household-invite/envelope-reveal'

const setMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: jest.fn().mockReturnValue({
      matches,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  })
}

const renderReveal = () =>
  render(
    <EnvelopeReveal coupleNames='Diego & Laura' websiteSubUrl='diego-and-laura'>
      <div>Invite card body</div>
    </EnvelopeReveal>
  )

describe('EnvelopeReveal', () => {
  afterEach(() => {
    window.sessionStorage.clear()
  })

  it('plays the envelope intro on the first visit of a session', () => {
    setMatchMedia(false)

    renderReveal()

    // The real card is always present (progressive enhancement)…
    expect(screen.getByText('Invite card body')).toBeInTheDocument()
    // …and the one-time intro overlay shows the couple's letter.
    expect(screen.getByText("You're Invited")).toBeInTheDocument()
    expect(screen.getByText('Diego & Laura')).toBeInTheDocument()
    // The intro is recorded so it doesn't replay on the next render this session.
    expect(window.sessionStorage.getItem('household_invite_envelope_diego-and-laura')).toBe('1')
  })

  it('skips the intro when it has already played this session', () => {
    setMatchMedia(false)
    window.sessionStorage.setItem('household_invite_envelope_diego-and-laura', '1')

    renderReveal()

    expect(screen.getByText('Invite card body')).toBeInTheDocument()
    expect(screen.queryByText("You're Invited")).not.toBeInTheDocument()
  })

  it('skips the intro when the guest prefers reduced motion', () => {
    setMatchMedia(true)

    renderReveal()

    expect(screen.getByText('Invite card body')).toBeInTheDocument()
    expect(screen.queryByText("You're Invited")).not.toBeInTheDocument()
    // A skipped intro must not consume the once-per-session flag.
    expect(window.sessionStorage.getItem('household_invite_envelope_diego-and-laura')).toBeNull()
  })
})
