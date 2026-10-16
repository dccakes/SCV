import {
  ADD_TABLE_FOCUS_KEY,
  dialogAfterSave,
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

describe('dialogAfterSave', () => {
  it('closes the edit dialog for the table that was saved', () => {
    expect(dialogAfterSave({ mode: 'edit', tableId: 't1' }, { mode: 'edit', tableId: 't1' })).toBe(
      null
    )
  })

  it('leaves a dialog for a different table open', () => {
    const open = { mode: 'edit', tableId: 't2' } as const
    expect(dialogAfterSave(open, { mode: 'edit', tableId: 't1' })).toBe(open)
  })

  it('leaves an edit dialog open when a create finishes, and vice versa', () => {
    const edit = { mode: 'edit', tableId: 't1' } as const
    const create = { mode: 'create' } as const
    expect(dialogAfterSave(edit, { mode: 'create' })).toBe(edit)
    expect(dialogAfterSave(create, { mode: 'edit', tableId: 't1' })).toBe(create)
  })

  it('closes the create dialog after a create, and leaves a closed dialog closed', () => {
    expect(dialogAfterSave({ mode: 'create' }, { mode: 'create' })).toBe(null)
    expect(dialogAfterSave(null, { mode: 'create' })).toBe(null)
  })
})
