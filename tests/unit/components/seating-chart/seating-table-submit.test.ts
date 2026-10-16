import {
  ADD_TABLE_FOCUS_KEY,
  dialogAfterSave,
  resolveTableSubmit,
  tableDialogFocusKey,
} from '~/components/seating-chart/seating-table-submit'

const tables = [{ id: 't1' }, { id: 't2' }]

describe('resolveTableSubmit', () => {
  it('creates when the dialog was opened to add a table', () => {
    expect(resolveTableSubmit({ mode: 'create', openId: 1 }, tables)).toEqual({ kind: 'create' })
  })

  it('updates the table being edited', () => {
    expect(resolveTableSubmit({ mode: 'edit', tableId: 't2', openId: 1 }, tables)).toEqual({
      kind: 'update',
      tableId: 't2',
    })
  })

  it('never creates a table when the one being edited was deleted meanwhile', () => {
    expect(resolveTableSubmit({ mode: 'edit', tableId: 'gone', openId: 1 }, tables)).toEqual({
      kind: 'missing',
    })
  })
})

describe('tableDialogFocusKey', () => {
  it('returns focus to the Add table button after creating', () => {
    expect(tableDialogFocusKey({ mode: 'create', openId: 1 })).toBe(ADD_TABLE_FOCUS_KEY)
  })

  it('returns focus to the edited table', () => {
    expect(tableDialogFocusKey({ mode: 'edit', tableId: 't1', openId: 1 })).toBe('table:t1')
  })
})

describe('dialogAfterSave', () => {
  it('closes the dialog opening that submitted', () => {
    expect(dialogAfterSave({ mode: 'create', openId: 1 }, 1)).toBeNull()
    expect(dialogAfterSave({ mode: 'edit', tableId: 't1', openId: 2 }, 2)).toBeNull()
  })

  it('leaves a reopened Add table dialog open when the earlier save finishes', () => {
    const reopened = { mode: 'create', openId: 2 } as const
    expect(dialogAfterSave(reopened, 1)).toBe(reopened)
  })

  it('leaves a reopened editor for the same table open', () => {
    const reopened = { mode: 'edit', tableId: 't1', openId: 5 } as const
    expect(dialogAfterSave(reopened, 4)).toBe(reopened)
  })

  it('leaves a closed dialog closed', () => {
    expect(dialogAfterSave(null, 1)).toBeNull()
  })
})
