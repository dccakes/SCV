import { resolveTableSubmit } from '~/components/seating-chart/seating-table-submit'

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
