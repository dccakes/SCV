import { render, screen } from '@testing-library/react'
import RsvpConfirmation from '~/components/website/rsvp-confirmation'

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
jest.mock('~/components/contexts/rsvp-form-context', () => ({
  useRsvpForm: () => ({
    weddingData: { groomFirstName: 'A', brideFirstName: 'B', events: [] },
    rsvpResponses: [],
  }),
}))

describe('RsvpConfirmation', () => {
  it('renders the homepage control as a native link to the wedding homepage', () => {
    render(<RsvpConfirmation basePath='/wedding' setCurrentStep={jest.fn()} />)

    const link = screen.getByRole('link', { name: 'backToHomepage' })
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '/wedding')
  })
})
