// Excel reads CSV as the system code page unless the file starts with a UTF-8
// byte order mark, which turns accented names like "José" into mojibake.
const UTF8_BOM = '﻿'

/** Trigger a browser download of CSV text. Client only. */
export const downloadCsv = (fileName: string, csv: string): void => {
  const url = URL.createObjectURL(new Blob([UTF8_BOM, csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

/** Lowercase, hyphen separated, ASCII only text for use in a file name. */
export const slugify = (value: string, fallback = 'export'): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || fallback
