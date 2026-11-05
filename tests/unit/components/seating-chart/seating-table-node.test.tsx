import { DndContext } from '@dnd-kit/core'
import { fireEvent, render, screen } from '@testing-library/react'

import { WorkspaceCapabilitiesProvider } from '~/components/contexts/workspace-capabilities-context'
import { SeatingTableNode } from '~/components/seating-chart/seating-table-node'
import type { SeatingGuest, SeatingTableView } from '~/server/domains/seating/seating.types'

const guest: SeatingGuest = {
  id: 1,
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
  tableId: 't1',
}

const table: SeatingTableView = {
  id: 't1',
  name: 'Head Table',
  shape: 'ROUND',
  capacity: 4,
  positionX: 0,
  positionY: 0,
  guestIds: [1],
}

const renderNode = (canEditPlanning: boolean) => {
  const onEdit = jest.fn()
  const onSelectGuest = jest.fn()
  render(
    <WorkspaceCapabilitiesProvider canEditPlanning={canEditPlanning}>
      <DndContext>
        <SeatingTableNode
          table={table}
          guestsById={new Map([[1, guest]])}
          onEdit={onEdit}
          onSelectGuest={onSelectGuest}
        />
      </DndContext>
    </WorkspaceCapabilitiesProvider>
  )
  return { onEdit, onSelectGuest }
}

describe('SeatingTableNode', () => {
  it('lets editors open the table editor and drag', () => {
    const { onEdit } = renderNode(true)

    fireEvent.click(screen.getByRole('button', { name: /Head Table, 1 of 4 seats filled/ }))
    expect(onEdit).toHaveBeenCalledWith('t1')
    expect(screen.getByRole('button', { name: /Ann Lee.*Press Space to move/ })).toBeInTheDocument()
  })

  it('shows the table read only for viewers but keeps guest details reachable', () => {
    const { onEdit, onSelectGuest } = renderNode(false)

    const tableSurface = screen.getByRole('img', { name: /Head Table, 1 of 4 seats filled/ })
    fireEvent.click(tableSurface)
    expect(onEdit).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: /Head Table/ })).not.toBeInTheDocument()

    const seated = screen.getByRole('button', { name: /Ann Lee/ })
    expect(seated.getAttribute('aria-label')).not.toMatch(/Press Space/)
    fireEvent.click(seated)
    expect(onSelectGuest).toHaveBeenCalledWith(1)
  })
})
