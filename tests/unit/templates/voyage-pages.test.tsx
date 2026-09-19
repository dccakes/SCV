import { fireEvent, render, screen, within } from '@testing-library/react'
import type { WeddingPageData } from '~/server/domains/website/website.types'
import { VoyageContentPage } from '~/templates/voyage/components/content-page'
import { VoyageHome } from '~/templates/voyage/components/home'

const event = (index: number) => ({
  id: `event-${index}`,
  name: `Celebration ${index}`,
  date: new Date(`2027-05-${20 + index}T00:00:00Z`),
  startTime: '15:30',
  endTime: '23:00',
  venue: `Venue ${index}`,
  attire: 'Formal',
  description: 'Join us for dinner.',
  weddingId: 'w',
  collectRsvp: true,
  questions: [],
})

const wedding = {
  brideFirstName: 'Holly',
  groomFirstName: 'Diego',
  date: {},
  daysRemaining: 100,
  websiteBuilderEnabled: true,
  events: Array.from({ length: 8 }, (_, i) => event(i)).reverse(),
  sections: [
    {
      id: 'travel',
      type: 'TRAVEL',
      isEnabled: true,
      content: {
        heading: 'Travel & Stay',
        body: 'Stay near the square.',
        stays: [{ name: 'Hotel without blurb', url: 'https://example.com/book' }],
      },
    },
  ],
  website: {
    templateId: 'voyage',
    headerImageUrl: null,
    coverPhotoUrl: null,
    coupleImageUrls: [],
    isRsvpEnabled: true,
    introText: '',
  },
} as unknown as WeddingPageData

describe('Voyage multi-page guest journeys', () => {
  it('offers direct task links without putting destination guides on home', () => {
    const { container } = render(<VoyageHome weddingData={wedding} path='/w/couple' />)
    expect(screen.getByRole('link', { name: /Book Your Stay/i })).toHaveAttribute(
      'href',
      '/w/couple/stay'
    )
    expect(screen.getByRole('link', { name: /What to Wear/i })).toHaveAttribute(
      'href',
      '/w/couple/weekend#what-to-wear'
    )
    expect(container.querySelector('#zocalo')).toBeNull()
    expect(container.querySelector('#flights')).toBeNull()
  })

  it('shows every registered event chronologically with complete details', () => {
    render(<VoyageContentPage page='weekend' weddingData={wedding} path='/w/couple' />)
    const schedule = screen.getByRole('region', { name: 'Schedule' })
    const events = within(schedule).getAllByRole('article')
    expect(events).toHaveLength(8)
    expect(events[0]).toHaveTextContent('Celebration 0')
    expect(events[7]).toHaveTextContent('Celebration 7')
    expect(events[0]).toHaveTextContent('20 May 2027')
    expect(events[0]).toHaveTextContent('15:30–23:00')
    expect(events[0]).toHaveTextContent('Venue 0')
    expect(events[0]).toHaveTextContent('Formal')
    expect(
      within(events[0] as HTMLElement).getByRole('link', { name: /directions/i })
    ).toHaveAttribute('href', expect.stringContaining('Venue%200'))
  })

  it('does not invent missing event details or dress codes', () => {
    render(
      <VoyageContentPage
        page='weekend'
        path='/w/couple'
        weddingData={{
          ...wedding,
          events: [
            { ...event(0), date: null, startTime: null, endTime: null, venue: null, attire: null },
          ],
        }}
      />
    )
    expect(screen.getByText('Date to be announced')).toBeInTheDocument()
    expect(screen.getByText('Time to be announced')).toBeInTheDocument()
    expect(screen.getByText('Venue details coming soon')).toBeInTheDocument()
    expect(screen.getAllByText(/Dress code to be announced/).length).toBeGreaterThan(0)
    expect(screen.queryByText('Formal')).toBeNull()
  })

  it('exposes a hotel booking link even without a long description', () => {
    render(<VoyageContentPage page='stay' weddingData={wedding} path='/w/couple' />)
    expect(screen.getByRole('link', { name: /Visit Website/i })).toHaveAttribute(
      'href',
      'https://example.com/book'
    )
  })

  it('provides contact copy and an inactive WhatsApp placeholder', () => {
    render(<VoyageContentPage page='faq' weddingData={wedding} path='/w/couple' />)
    expect(screen.getByText(/contact Holly or Diego/)).toBeInTheDocument()
    expect(screen.getByText('Invite link coming soon')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Join.*WhatsApp/i })).toBeNull()
  })

  it('preserves configured FAQ answers alongside related page links', () => {
    const data = {
      ...wedding,
      sections: [
        {
          type: 'FAQ',
          content: {
            heading: 'Questions',
            items: [
              {
                question: 'Is there an airport shuttle?',
                answer: 'Our pickup leaves Terminal 2 at 14:00.',
              },
            ],
          },
        },
      ],
    } as unknown as WeddingPageData
    render(<VoyageContentPage page='faq' weddingData={data} path='/w/couple' />)
    expect(screen.getByText('Our pickup leaves Terminal 2 at 14:00.')).toBeInTheDocument()
  })

  it('closes mobile navigation on selection and Escape and marks the active page', () => {
    render(<VoyageContentPage page='stay' weddingData={wedding} path='/w/couple' />)
    const toggle = screen.getByRole('button', { name: 'Menu' })
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const menu = screen.getByRole('navigation', { name: 'Mobile wedding navigation' })
    expect(within(menu).getByRole('link', { name: 'Where to Stay' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    fireEvent.click(within(menu).getByRole('link', { name: 'Travel' }))
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })
})
