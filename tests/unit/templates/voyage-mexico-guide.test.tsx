import { render, screen, within } from '@testing-library/react'

import { VoyageHome } from '~/templates/voyage/components/home'
import { VoyageExploreMexico, VoyageZocalo } from '~/templates/voyage/components/mexico-guide'

const baseWedding = {
  groomFirstName: 'John',
  groomLastName: 'Doe',
  brideFirstName: 'Jane',
  brideLastName: 'Smith',
  date: { standardFormat: 'May 30, 2027', numberFormat: '5/30/2027' },
  daysRemaining: 100,
  events: [],
  sections: [],
  website: {
    headerImageUrl: null,
    coverPhotoUrl: null,
    isRsvpEnabled: false,
    coupleImageUrls: [],
    introText: '',
  },
}

describe('VoyageZocalo', () => {
  it('renders the walkable Centro Histórico sights with their walking distance', () => {
    render(<VoyageZocalo />)

    expect(screen.getByRole('heading', { name: 'Welcome to Puebla' })).toBeInTheDocument()
    expect(screen.getByText('Catedral de Puebla')).toBeInTheDocument()
    expect(screen.getByText('Capilla del Rosario')).toBeInTheDocument()
    expect(screen.getByText('Biblioteca Palafoxiana')).toBeInTheDocument()
    expect(screen.getAllByText(/min walk/).length).toBeGreaterThanOrEqual(3)
  })

  it('renders the eat & drink and short-drive lists', () => {
    render(<VoyageZocalo />)

    expect(screen.getByText('Eat & Drink')).toBeInTheDocument()
    expect(screen.getByText('Mole poblano')).toBeInTheDocument()
    expect(screen.getByText('Worth the Short Drive')).toBeInTheDocument()
    expect(screen.getByText(/^Cholula/)).toBeInTheDocument()
  })

  it('renders the practical arrival notes, including the museum closing days', () => {
    render(<VoyageZocalo />)

    expect(screen.getByText('Good to Know')).toBeInTheDocument()
    expect(screen.getByText('Getting here from the airport')).toBeInTheDocument()
    expect(screen.getByText('A word on Mondays')).toBeInTheDocument()
    // Museo Amparo is the exception to the Monday rule; guests need both facts.
    expect(screen.getByText(/closes on Tuesday/)).toBeInTheDocument()
    expect(screen.getByText(/Closed Tuesdays, not Mondays/)).toBeInTheDocument()
  })

  // The side artwork is positioned against the section, so below 2xl it lands
  // on top of the centred max-w-6xl copy column rather than in the margin.
  it('keeps the decorative artwork out of the copy column below 2xl', () => {
    const { container } = render(<VoyageZocalo />)

    const decor = container.querySelector('[aria-hidden="true"][class*="absolute"]')
    expect(decor).not.toBeNull()
    expect(decor?.className).toContain('2xl:block')
    expect(decor?.className).not.toContain('lg:block')
    // And the copy is layered above it either way.
    expect(container.querySelector('.z-10')).not.toBeNull()
  })

  it('exposes a #zocalo anchor for the nav', () => {
    const { container } = render(<VoyageZocalo />)

    expect(container.querySelector('#zocalo')).not.toBeNull()
  })
})

describe('VoyageExploreMexico', () => {
  it('renders every recommended destination with its highlights', () => {
    render(<VoyageExploreMexico />)

    expect(screen.getByRole('heading', { name: 'Where to Go in Mexico' })).toBeInTheDocument()
    for (const name of [
      'Mexico City',
      'Oaxaca City',
      'Puerto Escondido',
      'San Miguel de Allende',
    ]) {
      const card = screen.getByRole('heading', { name }).closest('article')
      expect(card).not.toBeNull()
      expect(within(card as HTMLElement).getAllByRole('listitem').length).toBeGreaterThan(2)
    }
  })

  it('tells guests how to get to each destination', () => {
    render(<VoyageExploreMexico />)

    expect(screen.getAllByText(/Getting there/).length).toBe(4)
  })

  it('exposes an #explore-mexico anchor for the nav', () => {
    const { container } = render(<VoyageExploreMexico />)

    expect(container.querySelector('#explore-mexico')).not.toBeNull()
  })
})

describe('VoyageHome Mexico guide', () => {
  it('renders both guide bands and links to them from the nav', () => {
    const { container } = render(<VoyageHome path='/w/x' weddingData={baseWedding as never} />)

    expect(container.querySelector('#zocalo')).not.toBeNull()
    expect(container.querySelector('#explore-mexico')).not.toBeNull()
    // Desktop nav + mobile drawer both render the item.
    expect(screen.getAllByRole('link', { name: 'Explore Mexico' })).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: 'Things to Do' })).toHaveLength(2)
  })
})
