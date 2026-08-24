import { render, screen } from '@testing-library/react'

import type { WebsiteSection } from '~/server/domains/website-section/website-section.types'
import { AureliaSections } from '~/templates/aurelia/components/sections'
import { ClassicSections } from '~/templates/classic/components/sections'

const baseFields = {
  websiteId: 'website-1',
  isEnabled: true,
  createdAt: new Date('2026-06-01T00:00:00.000Z'),
  updatedAt: new Date('2026-06-01T00:00:00.000Z'),
}

const ourStory: WebsiteSection = {
  ...baseFields,
  id: 'sec-story',
  type: 'OUR_STORY',
  position: 1,
  content: { heading: 'Our Story', body: 'We met in Rome.\n\nThen everything changed.' },
}

const party: WebsiteSection = {
  ...baseFields,
  id: 'sec-party',
  type: 'WEDDING_PARTY',
  position: 2,
  content: { heading: 'Wedding Party', members: [{ name: 'Sam', role: 'Best Man' }] },
}

const registry: WebsiteSection = {
  ...baseFields,
  id: 'sec-registry',
  type: 'REGISTRY',
  position: 5,
  content: {
    heading: 'Registry',
    body: 'Your presence is enough.',
    links: [{ label: 'Zola', url: 'https://zola.com' }],
  },
}

const emptyParty: WebsiteSection = {
  ...baseFields,
  id: 'sec-party-empty',
  type: 'WEDDING_PARTY',
  position: 2,
  content: { heading: 'Wedding Party', members: [] },
}

describe.each([
  ['ClassicSections', ClassicSections],
  ['AureliaSections', AureliaSections],
])('%s', (_name, Sections) => {
  it('renders headings and prose paragraphs', () => {
    render(<Sections sections={[ourStory]} />)
    expect(screen.getByText('We met in Rome.')).toBeInTheDocument()
    expect(screen.getByText('Then everything changed.')).toBeInTheDocument()
  })

  it('renders wedding party members and registry links', () => {
    render(<Sections sections={[party, registry]} />)
    expect(screen.getByText('Sam')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Zola' })
    expect(link).toHaveAttribute('href', 'https://zola.com')
  })

  it('omits list sections that have no items', () => {
    render(<Sections sections={[emptyParty]} />)
    expect(screen.queryByText('Wedding Party')).not.toBeInTheDocument()
  })

  it('renders nothing when there are no sections', () => {
    const { container } = render(<Sections sections={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('section layout differs by template', () => {
  it('Aurelia uses card/grid structure that Classic does not', () => {
    const { container: classicContainer } = render(<ClassicSections sections={[party]} />)
    const { container: aureliaContainer } = render(<AureliaSections sections={[party]} />)

    // Aurelia wraps each member in a bordered card; Classic uses a plain list.
    expect(aureliaContainer.querySelector('.grid')).not.toBeNull()
    expect(classicContainer.querySelector('.grid')).toBeNull()
    expect(classicContainer.querySelector('ul')).not.toBeNull()
  })
})
