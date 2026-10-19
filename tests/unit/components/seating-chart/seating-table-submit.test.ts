import {
  ADD_TABLE_FOCUS_KEY,
  dialogAfterSave,
  tableDialogFocusKey,
} from '~/components/seating-chart/seating-table-submit'

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
