export type TableDialogState = { mode: 'create' } | { mode: 'edit'; tableId: string } | null

type TableSubmitAction =
  | { kind: 'create' }
  | { kind: 'update'; tableId: string }
  | { kind: 'missing' }

/**
 * Decides what saving the table dialog does from how it was opened, so an
 * edit of a table someone else deleted never turns into creating a new one.
 */
export const resolveTableSubmit = (
  dialog: NonNullable<TableDialogState>,
  tables: ReadonlyArray<{ id: string }>
): TableSubmitAction => {
  if (dialog.mode === 'create') return { kind: 'create' }
  return tables.some((table) => table.id === dialog.tableId)
    ? { kind: 'update', tableId: dialog.tableId }
    : { kind: 'missing' }
}

export const ADD_TABLE_FOCUS_KEY = 'add-table'

/**
 * Where focus returns when the table dialog closes. These dialogs open from
 * state, not a Radix trigger, so without this focus would drop to the page.
 */
export const tableDialogFocusKey = (dialog: NonNullable<TableDialogState>): string =>
  dialog.mode === 'edit' ? `table:${dialog.tableId}` : ADD_TABLE_FOCUS_KEY
