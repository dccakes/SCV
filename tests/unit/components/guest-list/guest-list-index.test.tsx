import { render, screen } from '@testing-library/react'

import GuestList from '~/components/guest-list/index'

jest.mock('~/app/_components/contexts/guest-form-context', () => ({
  useGuestForm: () => false,
  useToggleGuestForm: () => jest.fn(),
}))

jest.mock('~/app/_components/contexts/event-form-context', () => ({
  useEventForm: () => false,
  useToggleEventForm: () => jest.fn(),
}))

jest.mock('~/app/_components/forms/guest-form', () => ({
  __esModule: true,
  default: () => <div data-testid='guest-form' />,
}))

jest.mock('~/app/_components/forms/event-form', () => ({
  __esModule: true,
  default: () => <div data-testid='event-form' />,
}))

jest.mock('~/components/guest-list/event-tabs', () => ({
  __esModule: true,
  default: () => <div data-testid='events-tabs' />,
}))

jest.mock('~/components/guest-list/guests-view', () => ({
  __esModule: true,
  default: () => <div data-testid='guests-view' />,
}))

jest.mock('~/components/guest-list/no-guests-view', () => ({
  __esModule: true,
  default: () => <div data-testid='no-guests-view' />,
}))

jest.mock('~/components/guest-list/invite-link-panel', () => ({
  InviteLinkPanel: () => <div data-testid='invite-link-panel' />,
}))

const dashboardDataNoGuests = {
  events: [],
  households: [],
  weddingData: {
    groomFirstName: null,
    groomLastName: null,
    brideFirstName: null,
    brideLastName: null,
  },
  totalGuests: 0,
  totalEvents: 0,
} as any

const dashboardDataWithGuests = {
  events: [],
  households: [
    {
      id: 'h1',
      guests: [{ id: 1, firstName: 'Alice', lastName: 'Smith', invitations: [] }],
      gifts: [],
      weddingId: 'w1',
      createdAt: new Date(),
      updatedAt: new Date(),
      address1: null,
      address2: null,
      city: null,
      state: null,
      zipCode: null,
      country: null,
      notes: null,
    },
  ],
  weddingData: {
    groomFirstName: null,
    groomLastName: null,
    brideFirstName: null,
    brideLastName: null,
  },
  totalGuests: 1,
  totalEvents: 0,
} as any

describe('GuestList index', () => {
  it('renders InviteLinkPanel when there are no guests', () => {
    render(<GuestList dashboardData={dashboardDataNoGuests} />)
    expect(screen.getByTestId('invite-link-panel')).toBeInTheDocument()
  })

  it('renders InviteLinkPanel when there are guests', () => {
    render(<GuestList dashboardData={dashboardDataWithGuests} />)
    expect(screen.getByTestId('invite-link-panel')).toBeInTheDocument()
  })

  it('renders GuestsView (not NoGuestsView) when totalGuests > 0', () => {
    render(<GuestList dashboardData={dashboardDataWithGuests} />)
    expect(screen.getByTestId('guests-view')).toBeInTheDocument()
    expect(screen.queryByTestId('no-guests-view')).not.toBeInTheDocument()
  })

  it('renders NoGuestsView (not GuestsView) when totalGuests = 0', () => {
    render(<GuestList dashboardData={dashboardDataNoGuests} />)
    expect(screen.getByTestId('no-guests-view')).toBeInTheDocument()
    expect(screen.queryByTestId('guests-view')).not.toBeInTheDocument()
  })
})
