import { fireEvent, render, screen } from '@testing-library/react'

import type { DashboardData } from '~/app/utils/shared-types'
import GuestList from '~/components/guest-list/index'

jest.mock('~/components/contexts/guest-form-context', () => ({
  useGuestForm: () => false,
  useToggleGuestForm: () => jest.fn(),
}))

jest.mock('~/components/contexts/event-form-context', () => ({
  useEventForm: () => false,
  useToggleEventForm: () => jest.fn(),
}))

jest.mock('~/components/forms/guest-form', () => ({
  __esModule: true,
  default: () => <div data-testid='guest-form' />,
}))

jest.mock('~/components/forms/event-form', () => ({
  __esModule: true,
  default: () => <div data-testid='event-form' />,
}))

jest.mock('~/components/guest-list/event-tabs', () => ({
  __esModule: true,
  default: () => <div data-testid='events-tabs' />,
}))

jest.mock('~/components/guest-list/guests-view', () => ({
  __esModule: true,
  default: ({ onImportClick }: { onImportClick: () => void }) => (
    <>
      <button type='button' onClick={onImportClick} data-testid='guests-import-button'>
        import
      </button>
      <div data-testid='guests-view' />
    </>
  ),
}))

jest.mock('~/components/guest-list/no-guests-view', () => ({
  __esModule: true,
  default: ({ onImportClick }: { onImportClick: () => void }) => (
    <>
      <button type='button' onClick={onImportClick} data-testid='no-guests-import-button'>
        import
      </button>
      <div data-testid='no-guests-view' />
    </>
  ),
}))

jest.mock('~/components/guest-list/invite-link-panel', () => ({
  InviteLinkPanel: () => <div data-testid='invite-link-panel' />,
}))

jest.mock('~/components/guest-list/csv-upload-dialog', () => ({
  CsvUploadDialog: () => <div data-testid='csv-upload-dialog' />,
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
} as unknown as DashboardData

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
} as unknown as DashboardData

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

  it('renders CSV dialog only after import click', async () => {
    render(<GuestList dashboardData={dashboardDataNoGuests} />)

    expect(screen.queryByTestId('csv-upload-dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('no-guests-import-button'))

    expect(await screen.findByTestId('csv-upload-dialog')).toBeInTheDocument()
  })
})
