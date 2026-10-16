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

/**
 * The dialog state after a table save succeeds: close it only if it is still
 * showing what was saved, so a save finishing late never closes (and loses)
 * another dialog the planner has opened since.
 */
export const dialogAfterSave = (
  current: TableDialogState,
  saved: NonNullable<TableDialogState>
): TableDialogState => {
  if (current === null || current.mode !== saved.mode) return current
  if (current.mode === 'edit' && saved.mode === 'edit' && current.tableId !== saved.tableId) {
    return current
  }
  return null
}
