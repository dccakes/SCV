/**
 * Guest CSV Import - Schema, Types & Parsing
 *
 * Contains all data definitions for the CSV import feature so the dialog
 * component stays focused on UI orchestration only.
 */

import Papa from 'papaparse'
import { z } from 'zod'

import { optionalPhoneSchemaNotNull } from '~/lib/phone/phone-validator'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const CSV_AGE_GROUPS = ['ADULT', 'CHILD', 'TEEN', 'INFANT'] as const

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v === '' ? undefined : v))

export const guestCsvRowSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: optionalString.pipe(z.string().email('Invalid email').optional()),
  phone: optionalString.pipe(optionalPhoneSchemaNotNull),
  ageGroup: z
    .string()
    .optional()
    .transform((v) => {
      const upper = (v ?? '').toUpperCase()
      return CSV_AGE_GROUPS.includes(upper as (typeof CSV_AGE_GROUPS)[number]) ? upper : 'ADULT'
    })
    .pipe(z.enum(CSV_AGE_GROUPS)),
  address1: optionalString,
  address2: optionalString,
  city: optionalString,
  state: optionalString,
  zipCode: optionalString,
  country: optionalString,
  notes: optionalString,
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GuestCsvRowInput = z.input<typeof guestCsvRowSchema>
export type GuestCsvRowOutput = z.output<typeof guestCsvRowSchema>

export type ParsedCsvRow = {
  rowNumber: number
  raw: GuestCsvRowInput
} & ({ valid: true; data: GuestCsvRowOutput } | { valid: false; errors: string[] })

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

const TEMPLATE_HEADERS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'ageGroup',
  'address1',
  'address2',
  'city',
  'state',
  'zipCode',
  'country',
  'notes',
]

const TEMPLATE_CSV =
  TEMPLATE_HEADERS.join(',') +
  '\nJohn,Smith,john@example.com,+12025550123,ADULT,123 Main St,,New York,NY,10001,USA,\nJane,Doe,,,,,,,,,,\n'

export function downloadGuestCsvTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'guest-import-template.csv'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

const MAX_CSV_ROWS = 500

export function parseCsvFile(file: File): Promise<ParsedCsvRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<GuestCsvRowInput>(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        if (data.length > MAX_CSV_ROWS) {
          reject(new Error(`CSV exceeds the ${MAX_CSV_ROWS}-row limit (found ${data.length} rows)`))
          return
        }
        const rows = data.map((raw, index) => {
          const result = guestCsvRowSchema.safeParse(raw)
          if (result.success) {
            return { rowNumber: index + 2, raw, valid: true as const, data: result.data }
          }
          return {
            rowNumber: index + 2,
            raw,
            valid: false as const,
            errors: result.error.issues.map((i) => i.message),
          }
        })
        resolve(rows)
      },
      error: (err) => {
        reject(err)
      },
    })
  })
}
