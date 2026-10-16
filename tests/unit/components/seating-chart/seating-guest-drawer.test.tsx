import { fireEvent, render, screen } from '@testing-library/react'

import { SeatingGuestDrawer } from '~/components/seating-chart/seating-guest-drawer'
import type { SeatingGuest, SeatingTableView } from '~/server/domains/seating/seating.types'

// Behaves like Radix Select: controlled only while `value` is defined, otherwise
// it keeps its own state, and re-picking the current value does not fire
jest.mock('~/components/ui/select', () => {
  const { useState } = jest.requireActual<typeof import('react')>('react')
  return {
    Select: ({
      value,
      onValueChange,
      children,
    }: {
      value?: string
      onValueChange: (value: string) => void
      children: React.ReactNode
    }) => {
      const [internal, setInternal] = useState('')
      const current = value === undefined ? internal : value
      return (
        <select
          aria-label='Seat at table'
          value={current}
          onChange={(event) => {
            const next = event.target.value
            if (next === current) return
            if (value === undefined) setInternal(next)
            onValueChange(next)
          }}
        >
          <option value=''>Choose</option>
          {children}
        </select>
      )
    },
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
  }
})

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
  const props = {
    household: null,
    tables: [table('t1', 'Head Table', 4, [1]), table('t2', 'Kids Table', 2, [2, 3])],
    onClose: jest.fn(),
    onSelectGuest: jest.fn(),
    onUnseat: jest.fn(),
    onSeat,
  }
  const { rerender } = render(<SeatingGuestDrawer {...props} guest={{ ...guest, ...overrides }} />)
  // Re-render the same drawer for another guest, as the app does when switching guests
  const rerenderWith = (next: Partial<SeatingGuest>) =>
    rerender(<SeatingGuestDrawer {...props} guest={{ ...guest, ...next }} />)
  return { onSeat, rerenderWith }
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

  it('starts empty for the next unseated guest after seating one, and can seat them too', () => {
    const { onSeat, rerenderWith } = renderDrawer()
    fireEvent.change(screen.getByLabelText('Seat at table'), { target: { value: 't1' } })
    expect(onSeat).toHaveBeenLastCalledWith(7, 't1')

    // Switch to an unseated housemate in the same drawer
    rerenderWith({ id: 8, firstName: 'Ben' })
    expect(screen.getByLabelText('Seat at table')).toHaveValue('')

    fireEvent.change(screen.getByLabelText('Seat at table'), { target: { value: 't1' } })
    expect(onSeat).toHaveBeenLastCalledWith(8, 't1')
  })

  it('shows unassigned again after a seat attempt is rolled back', () => {
    const { onSeat, rerenderWith } = renderDrawer()
    fireEvent.change(screen.getByLabelText('Seat at table'), { target: { value: 't1' } })

    // Server rejected it; the guest is still unseated after rollback
    rerenderWith({})
    expect(screen.getByLabelText('Seat at table')).toHaveValue('')
    fireEvent.change(screen.getByLabelText('Seat at table'), { target: { value: 't1' } })
    expect(onSeat).toHaveBeenCalledTimes(2)
  })
})
