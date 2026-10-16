import { DndContext } from '@dnd-kit/core'
import { fireEvent, render, screen, within } from '@testing-library/react'

import { SeatingGuestSidebar } from '~/components/seating-chart/seating-guest-sidebar'
import type { SeatingGuest, SeatingHousehold } from '~/server/domains/seating/seating.types'

const guest = (overrides: Partial<SeatingGuest> & { id: number }): SeatingGuest => ({
  firstName: `First${overrides.id}`,
  lastName: 'Smith',
  email: null,
  phone: null,
  ageGroup: 'ADULT',
  isPrimaryContact: false,
  isTagAlong: false,
  householdId: 'h1',
  rsvp: 'Attending',
  dietaryRestrictions: null,
  tags: [],
  tableId: null,
  ...overrides,
})

const households: SeatingHousehold[] = [
  {
    id: 'h1',
    address: null,
    notes: null,
    guests: [
      guest({ id: 1, firstName: 'Ann' }),
      guest({ id: 2, firstName: 'Ben', tableId: 'table-1' }),
    ],
  },
  {
    id: 'h2',
    address: null,
    notes: null,
    guests: [guest({ id: 3, firstName: 'Cara', lastName: 'Jones', householdId: 'h2' })],
  },
]

const renderSidebar = (onSelectGuest = jest.fn()) => {
  render(
    <DndContext>
      <SeatingGuestSidebar
        households={households}
        totalGuests={3}
        seatedGuests={1}
        onSelectGuest={onSelectGuest}
      />
    </DndContext>
  )
  return { onSelectGuest }
}

describe('SeatingGuestSidebar', () => {
  it('groups unseated guests by household and hides seated ones', () => {
    renderSidebar()

    const smith = screen.getByRole('button', { name: /Smith household, 1 unseated/ })
    expect(smith).toHaveTextContent('1/2')
    expect(screen.getByRole('button', { name: /Ann Smith/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Ben Smith/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Jones household/ })).toBeInTheDocument()
    expect(screen.getByText('1/3 seated')).toBeInTheDocument()
  })

  it('opens guest details when a guest is clicked', () => {
    const { onSelectGuest } = renderSidebar()

    fireEvent.click(screen.getByRole('button', { name: /Cara Jones/ }))
    expect(onSelectGuest).toHaveBeenCalledWith(3)
  })

  it('filters by search', () => {
    renderSidebar()

    fireEvent.change(screen.getByLabelText('Search unseated guests'), {
      target: { value: 'cara' },
    })
    const list = screen.getByRole('complementary', { name: 'Unseated guests' })
    expect(within(list).queryByRole('button', { name: /Ann Smith/ })).not.toBeInTheDocument()
    expect(within(list).getByRole('button', { name: /Cara Jones/ })).toBeInTheDocument()
  })

  it('lets touch users scroll the list: rows allow panning, drags start on long press', () => {
    renderSidebar()

    for (const row of [
      screen.getByRole('button', { name: /Ann Smith/ }),
      screen.getByRole('button', { name: /Smith household/ }),
    ]) {
      expect(row).not.toHaveClass('touch-none')
      expect(row).toHaveClass('touch-manipulation')
    }
  })

  it('drags the whole unseated household from its header even when a search hides members', () => {
    render(
      <DndContext>
        <SeatingGuestSidebar
          households={[
            {
              id: 'h9',
              address: null,
              notes: null,
              guests: [
                guest({ id: 21, firstName: 'Papa', lastName: 'Bear', householdId: 'h9' }),
                guest({ id: 22, firstName: 'Mama', lastName: 'Bear', householdId: 'h9' }),
                guest({ id: 23, firstName: 'Baby', lastName: 'Bear', householdId: 'h9' }),
                guest({
                  id: 24,
                  firstName: 'Uncle',
                  lastName: 'Bear',
                  householdId: 'h9',
                  tableId: 't1',
                }),
              ],
            },
          ]}
          totalGuests={4}
          seatedGuests={1}
          onSelectGuest={jest.fn()}
        />
      </DndContext>
    )

    fireEvent.change(screen.getByLabelText('Search unseated guests'), {
      target: { value: 'papa' },
    })

    // Only the matching guest is listed...
    expect(screen.getByRole('button', { name: /Papa Bear\./ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Mama Bear\./ })).not.toBeInTheDocument()
    // ...but the header still moves all three unseated members, and says so
    const header = screen.getByRole('button', { name: /^Bear household, 3 unseated/ })
    expect(header).toHaveTextContent('3/4')
    expect(header).toHaveAttribute('data-seating-guest-ids', '21,22,23')
  })
})
