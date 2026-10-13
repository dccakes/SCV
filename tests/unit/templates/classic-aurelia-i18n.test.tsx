import { screen } from '@testing-library/react'
import { renderWithIntl } from '~/../tests/unit/test-utils/intl'
import { AureliaHome } from '~/templates/aurelia/components/home'
import { AureliaInvitation } from '~/templates/aurelia/components/invitation'
import { ClassicHome } from '~/templates/classic/components/home'
import { ClassicSaveTheDate } from '~/templates/classic/components/save-the-date'

// Null image urls keep next/image out of the render.
const wedding = {
  groomFirstName: 'Juan',
  groomLastName: 'Pérez',
  brideFirstName: 'Ana',
  brideLastName: 'López',
  date: { standardFormat: 'Sunday, May 30, 2027', numberFormat: '05.30.2027' },
  daysRemaining: 100,
  events: [
    {
      id: 'evt-1',
      name: 'Wedding Day',
      date: new Date('2027-05-30T00:00:00.000Z'),
      startTime: '5:00 PM',
      endTime: null,
      venue: 'Hacienda',
    },
  ],
  sections: [],
  website: {
    url: 'https://example.com/w/ana-juan',
    headerImageUrl: null,
    coverPhotoUrl: null,
    isRsvpEnabled: true,
    coupleImageUrls: [],
    introText: '',
  },
} as never

describe('Classic and Aurelia in Mexican Spanish', () => {
  it('Classic Save the Date renders Spanish boilerplate and a localized date', () => {
    renderWithIntl(<ClassicSaveTheDate path='/w/x' weddingData={wedding} />, { locale: 'es' })

    expect(screen.getByText('Reserva la fecha')).toBeInTheDocument()
    expect(screen.getByText('La invitación formal llegará pronto.')).toBeInTheDocument()
    expect(screen.getByText('¡Faltan 100 días!')).toBeInTheDocument()
    expect(screen.getByText('domingo, 30 de mayo de 2027')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Visita nuestro sitio web' })).toBeInTheDocument()
  })

  it('Aurelia Invitation renders Spanish defaults and event date', () => {
    renderWithIntl(<AureliaInvitation path='/w/x' weddingData={wedding} />, { locale: 'es' })

    expect(screen.getByText('Junto con sus familias')).toBeInTheDocument()
    expect(screen.getByText('y')).toBeInTheDocument()
    expect(screen.getByText('30 de mayo de 2027')).toBeInTheDocument()
    // A time typed as "5:00 PM" reads on the 24-hour clock for Spanish visitors.
    expect(screen.getByText('17:00')).toBeInTheDocument()
    expect(screen.queryByText('5:00 PM')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Confirmar asistencia' })).toBeInTheDocument()
  })

  it.each([
    ['Classic', ClassicHome],
    ['Aurelia', AureliaHome],
  ] as const)('%s home navbar is translated and offers the language switch', (_name, Home) => {
    renderWithIntl(<Home path='/w/x' weddingData={wedding} />, { locale: 'es' })

    const nav = screen.getByRole('navigation', { name: 'Sitio web de la boda' })
    expect(nav).toHaveTextContent('Inicio')
    expect(nav).toHaveTextContent('Invitación')
    expect(screen.getByRole('button', { name: 'Switch to English' })).toBeInTheDocument()
    expect(screen.getByText('30.05.2027')).toBeInTheDocument()
  })

  it('keeps English copy and US date order for en visitors', () => {
    renderWithIntl(<ClassicHome path='/w/x' weddingData={wedding} />, { locale: 'en' })

    expect(screen.getByText('100 Days To Go!')).toBeInTheDocument()
    expect(screen.getByText('Sunday, May 30, 2027')).toBeInTheDocument()
    expect(screen.getByText('05.30.2027')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cambiar a español' })).toBeInTheDocument()
  })
})
