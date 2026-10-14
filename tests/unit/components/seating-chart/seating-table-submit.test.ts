import {
  ADD_TABLE_FOCUS_KEY,
  resolveTableSubmit,
  tableDialogFocusKey,
} from '~/components/seating-chart/seating-table-submit'

const tables = [{ id: 't1' }, { id: 't2' }]

describe('resolveTableSubmit', () => {
  it('creates when the dialog was opened to add a table', () => {
    expect(resolveTableSubmit({ mode: 'create' }, tables)).toEqual({ kind: 'create' })
  })

  it('updates the table being edited', () => {
    expect(resolveTableSubmit({ mode: 'edit', tableId: 't2' }, tables)).toEqual({
      kind: 'update',
      tableId: 't2',
    })
  })

  it('never creates a table when the one being edited was deleted meanwhile', () => {
    expect(resolveTableSubmit({ mode: 'edit', tableId: 'gone' }, tables)).toEqual({
      kind: 'missing',
    })
  })
})

describe('tableDialogFocusKey', () => {
  it('returns focus to the Add table button after creating', () => {
    expect(tableDialogFocusKey({ mode: 'create' })).toBe(ADD_TABLE_FOCUS_KEY)
  })

  it('returns focus to the edited table', () => {
    expect(tableDialogFocusKey({ mode: 'edit', tableId: 't1' })).toBe('table:t1')
  })
})
