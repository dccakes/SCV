import { screen } from '@testing-library/react'
import { renderWithIntl } from '~/../tests/unit/test-utils/intl'
import RsvpNotAcceptingMessage from '~/components/website/rsvp-not-accepting-message'

describe('RsvpNotAcceptingMessage', () => {
  it('renders in English by default', () => {
    renderWithIntl(<RsvpNotAcceptingMessage basePath='/w/our-wedding' />)

    expect(screen.getByRole('heading', { name: 'RSVPs not yet open' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Wedding' })).toHaveAttribute(
      'href',
      '/w/our-wedding'
    )
  })

  it('renders in Spanish with a way back to English', () => {
    renderWithIntl(<RsvpNotAcceptingMessage basePath='/w/our-wedding' />, { locale: 'es' })

    expect(screen.getByText('Muy pronto')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Las confirmaciones aún no están abiertas' })
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Todavía no estamos listos para recibir confirmaciones de asistencia. ¡Vuelve pronto!'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Regresar a la boda' })).toHaveAttribute(
      'href',
      '/w/our-wedding'
    )
    expect(screen.getByRole('button', { name: 'Switch to English' })).toBeInTheDocument()
  })
})
