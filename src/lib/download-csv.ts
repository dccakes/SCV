// Excel reads CSV as the system code page unless the file starts with a UTF-8
// byte order mark, which turns accented names like "José" into mojibake.
const UTF8_BOM = '\uFEFF'

/** Trigger a browser download of CSV text. Client only. */
export const downloadCsv = (fileName: string, csv: string): void => {
  const url = URL.createObjectURL(new Blob([UTF8_BOM, csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  // Revoking in the same tick can cancel the download in some browsers
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** Lowercase, hyphen separated, ASCII only text for use in a file name. */
export const slugify = (value: string, fallback = 'export'): string =>
  value
    // Fold accents ("Cérémonie" -> "ceremonie") instead of dropping the letter
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || fallback

/** Today's date in the viewer's own time zone, as YYYY-MM-DD, for file names. */
export const localDateStamp = (date: Date = new Date()): string => {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
