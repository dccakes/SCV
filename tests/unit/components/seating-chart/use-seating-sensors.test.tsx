import { DndContext } from '@dnd-kit/core'
import { fireEvent, render, screen } from '@testing-library/react'

import { SeatingTableNode } from '~/components/seating-chart/seating-table-node'
import { useSeatingSensors } from '~/components/seating-chart/use-seating-sensors'

function Harness(props: Readonly<{ onEdit: () => void }>) {
  const sensors = useSeatingSensors()
  return (
    <DndContext sensors={sensors}>
      <SeatingTableNode
        table={{
          id: 't1',
          name: 'Head Table',
          shape: 'ROUND',
          capacity: 4,
          positionX: 0,
          positionY: 0,
          guestIds: [],
        }}
        guestsById={new Map()}
        onEdit={props.onEdit}
        onSelectGuest={jest.fn()}
      />
    </DndContext>
  )
}

describe('useSeatingSensors', () => {
  it('leaves Enter to the button so keyboard users can open the table editor', () => {
    const onEdit = jest.fn()
    render(<Harness onEdit={onEdit} />)
    const table = screen.getByRole('button', { name: /^Head Table,/ })

    // keyDown returns false when a handler called preventDefault (i.e. a drag started)
    expect(fireEvent.keyDown(table, { code: 'Enter', key: 'Enter' })).toBe(true)
    fireEvent.click(table)
    expect(onEdit).toHaveBeenCalledWith('t1')
  })

  it('picks the table up with Space', () => {
    render(<Harness onEdit={jest.fn()} />)
    const table = screen.getByRole('button', { name: /^Head Table,/ })

    expect(fireEvent.keyDown(table, { code: 'Space', key: ' ' })).toBe(false)
  })

  it('describes the keyboard controls in the accessible name', () => {
    render(<Harness onEdit={jest.fn()} />)

    expect(
      screen.getByRole('button', { name: /Press Space to move, or Enter to edit/ })
    ).toBeInTheDocument()
  })
})
