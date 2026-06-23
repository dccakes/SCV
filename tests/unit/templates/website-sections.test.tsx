import { render, screen } from '@testing-library/react'

import type { WebsiteSection } from '~/server/domains/website-section/website-section.types'
import { WebsiteSections } from '~/templates/shared/website-sections'

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

const faq: WebsiteSection = {
  ...baseFields,
  id: 'sec-faq',
  type: 'FAQ',
  position: 4,
  content: { heading: 'Questions', items: [{ question: 'Dress code?', answer: 'Black tie.' }] },
}

const emptyParty: WebsiteSection = {
  ...baseFields,
  id: 'sec-party',
  type: 'WEDDING_PARTY',
  position: 2,
  content: { heading: 'Wedding Party', members: [] },
}

describe('WebsiteSections', () => {
  it('renders heading and prose paragraphs for content sections', () => {
    render(<WebsiteSections sections={[ourStory]} />)

    expect(screen.getByRole('heading', { name: 'Our Story' })).toBeInTheDocument()
    expect(screen.getByText('We met in Rome.')).toBeInTheDocument()
    expect(screen.getByText('Then everything changed.')).toBeInTheDocument()
  })

  it('renders FAQ items as question/answer pairs', () => {
    render(<WebsiteSections sections={[faq]} />)

    expect(screen.getByText('Dress code?')).toBeInTheDocument()
    expect(screen.getByText('Black tie.')).toBeInTheDocument()
  })

  it('omits list sections that have no items', () => {
    const { container } = render(<WebsiteSections sections={[emptyParty]} />)

    expect(screen.queryByText('Wedding Party')).not.toBeInTheDocument()
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when there are no sections', () => {
    const { container } = render(<WebsiteSections sections={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
