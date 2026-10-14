import type { Active, Over } from '@dnd-kit/core'

import {
  createSeatingAnnouncements,
  SEATING_SCREEN_READER_INSTRUCTIONS,
} from '~/components/seating-chart/seating-announcements'

const tables = {
  t1: { name: 'Head Table', capacity: 4, guestIds: [1, 2] },
  t2: { name: 'Kids Table', capacity: 2, guestIds: [3, 4] },
}
const announcements = createSeatingAnnouncements((id) => tables[id as keyof typeof tables])

const active = (data: unknown) => ({ id: 'x', data: { current: data } }) as unknown as Active
const over = (data: unknown) => ({ id: 'y', data: { current: data } }) as unknown as Over
const guests = (guestIds: number[], label: string) => active({ type: 'guests', guestIds, label })
const overTable = (tableId: string) => over({ type: 'table', tableId })

describe('seating announcements', () => {
  it('names the picked-up guest or table instead of an id', () => {
    expect(announcements.onDragStart({ active: guests([5], 'Ann Lee') })).toBe(
      'Picked up Ann Lee. Use the arrow keys to move onto a table, Space to drop, Escape to cancel.'
    )
    expect(announcements.onDragStart({ active: active({ type: 'table', tableId: 't1' }) })).toBe(
      'Picked up Head Table. Use the arrow keys to move it, Space to drop, Escape to cancel.'
    )
  })

  it('says how many seats are open when over a table', () => {
    expect(
      announcements.onDragOver?.({ active: guests([5], 'Ann Lee'), over: overTable('t1') })
    ).toBe('Ann Lee is over Head Table, 2 open seats.')
  })

  it('warns when the table does not have room', () => {
    expect(
      announcements.onDragOver?.({
        active: guests([5, 6, 7], 'Lee household'),
        over: overTable('t1'),
      })
    ).toBe('Lee household is over Head Table, not enough seats.')
  })

  it('announces the real outcome of a drop', () => {
    const ann = guests([5], 'Ann Lee')
    expect(announcements.onDragEnd({ active: ann, over: overTable('t1') })).toBe(
      'Ann Lee seated at Head Table.'
    )
    expect(announcements.onDragEnd({ active: ann, over: overTable('t2') })).toBe(
      'Not enough seats at Kids Table. Ann Lee was not moved.'
    )
    expect(announcements.onDragEnd({ active: ann, over: over({ type: 'unassigned' }) })).toBe(
      'Ann Lee moved to unseated guests.'
    )
    expect(announcements.onDragEnd({ active: ann, over: null })).toBe(
      'Ann Lee was not dropped on a table and was not moved.'
    )
  })

  it('announces cancel and table drops', () => {
    expect(announcements.onDragCancel({ active: guests([5], 'Ann Lee'), over: null })).toBe(
      'Moving Ann Lee was cancelled.'
    )
    expect(
      announcements.onDragEnd({ active: active({ type: 'table', tableId: 't1' }), over: null })
    ).toBe('Head Table moved.')
  })

  it('explains the keyboard controls', () => {
    expect(SEATING_SCREEN_READER_INSTRUCTIONS.draggable).toMatch(
      /Space.*arrow keys.*Escape.*Enter/s
    )
  })
})
