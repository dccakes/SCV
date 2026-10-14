import { fireEvent, render, screen } from '@testing-library/react'

import { SeatingGuestDrawer } from '~/components/seating-chart/seating-guest-drawer'
import type { SeatingGuest, SeatingTableView } from '~/server/domains/seating/seating.types'

jest.mock('~/components/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value?: string
    onValueChange: (value: string) => void
    children: React.ReactNode
  }) => (
    <select
      aria-label='Seat at table'
      value={value ?? ''}
      onChange={(event) => onValueChange(event.target.value)}
    >
      <option value=''>Choose</option>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({
    value,
    disabled,
    children,
  }: {
    value: string
    disabled?: boolean
    children: React.ReactNode
  }) => (
    <option value={value} disabled={disabled}>
      {children}
    </option>
  ),
}))

const guest: SeatingGuest = {
  id: 7,
  firstName: 'Ann',
  lastName: 'Lee',
  email: null,
  phone: null,
  ageGroup: 'ADULT',
  isPrimaryContact: true,
  isTagAlong: false,
  householdId: 'h1',
  rsvp: 'Attending',
  dietaryRestrictions: null,
  tags: [],
  tableId: null,
}

const table = (
  id: string,
  name: string,
  capacity: number,
  guestIds: number[]
): SeatingTableView => ({
  id,
  name,
  shape: 'ROUND',
  capacity,
  positionX: 0,
  positionY: 0,
  guestIds,
})

const renderDrawer = (overrides: Partial<SeatingGuest> = {}) => {
  const onSeat = jest.fn()
  render(
    <SeatingGuestDrawer
      guest={{ ...guest, ...overrides }}
      household={null}
      tables={[table('t1', 'Head Table', 4, [1]), table('t2', 'Kids Table', 2, [2, 3])]}
      onClose={jest.fn()}
      onSelectGuest={jest.fn()}
      onUnseat={jest.fn()}
      onSeat={onSeat}
    />
  )
  return { onSeat }
}

describe('SeatingGuestDrawer seat picker', () => {
  it('seats the guest at the chosen table without dragging', () => {
    const { onSeat } = renderDrawer()

    fireEvent.change(screen.getByLabelText('Seat at table'), { target: { value: 't1' } })

    expect(onSeat).toHaveBeenCalledWith(7, 't1')
  })

  it('lists open seats and disables full tables', () => {
    renderDrawer()

    expect(screen.getByRole('option', { name: 'Head Table (3 open)' })).toBeEnabled()
    expect(screen.getByRole('option', { name: 'Kids Table (full)' })).toBeDisabled()
  })

  it('shows the current table as selected and does not re-seat on it', () => {
    const { onSeat } = renderDrawer({ tableId: 't2' })

    expect(screen.getByLabelText('Seat at table')).toHaveValue('t2')
    // The guest's own full table stays selectable, it is where they sit
    expect(screen.getByRole('option', { name: 'Kids Table (full)' })).toBeEnabled()
    fireEvent.change(screen.getByLabelText('Seat at table'), { target: { value: 't2' } })
    expect(onSeat).not.toHaveBeenCalled()
  })
})
