import { formatGuestName } from '~/lib/seating/guest-name'

type CsvTable = { id: string; name: string }
type CsvGuest = { firstName: string; lastName: string; tableId: string | null }

const UNASSIGNED = 'Unassigned'

// Prefix values a spreadsheet would evaluate as a formula
const neutralizeFormula = (value: string): string =>
  /^[=+\-@\t\r]/.test(value) ? `'${value}` : value

const escapeCsvValue = (raw: string): string => {
  const value = neutralizeFormula(raw)
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

/**
 * One row per guest with their table. Seated guests come first, ordered by
 * table name then guest name; unassigned guests are listed last.
 */
export const buildSeatingCsv = (
  tables: readonly CsvTable[],
  guests: readonly CsvGuest[]
): string => {
  const tableNames = new Map(tables.map((table) => [table.id, table.name]))

  const rows = guests
    .map((guest) => ({
      name: formatGuestName(guest),
      table: (guest.tableId && tableNames.get(guest.tableId)) || null,
    }))
    .sort((a, b) => {
      if (a.table !== b.table && (a.table === null || b.table === null)) {
        return a.table === null ? 1 : -1
      }
      return (a.table ?? '').localeCompare(b.table ?? '') || a.name.localeCompare(b.name)
    })

  return [
    'Guest Name,Table',
    ...rows.map((row) => `${escapeCsvValue(row.name)},${escapeCsvValue(row.table ?? UNASSIGNED)}`),
  ].join('\r\n')
}
