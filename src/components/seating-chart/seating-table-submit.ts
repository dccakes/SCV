// openId identifies each time a dialog is opened, so a save can tell whether
// the dialog on screen is still the one it was submitted from
export type TableDialogState =
  | { mode: 'create'; openId: number }
  | { mode: 'edit'; tableId: string; openId: number }
  | null

export const ADD_TABLE_FOCUS_KEY = 'add-table'

/**
 * Where focus returns when the table dialog closes. These dialogs open from
 * state, not a Radix trigger, so without this focus would drop to the page.
 */
export const tableDialogFocusKey = (dialog: NonNullable<TableDialogState>): string =>
  dialog.mode === 'edit' ? `table:${dialog.tableId}` : ADD_TABLE_FOCUS_KEY

/**
 * The dialog state after a table save succeeds: close it only if the dialog on
 * screen is the same opening that submitted. A save finishing after the planner
 * dismissed and reopened a dialog (even for the same table) leaves it alone.
 */
export const dialogAfterSave = (
  current: TableDialogState,
  savedOpenId: number
): TableDialogState => (current?.openId === savedOpenId ? null : current)
