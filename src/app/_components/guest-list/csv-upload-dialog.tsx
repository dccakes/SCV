'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import type { Event } from '~/app/utils/shared-types'
import { api } from '~/trpc/react'

// ---------------------------------------------------------------------------
// CSV row schema (client-side validation)
// ---------------------------------------------------------------------------
const CSV_AGE_GROUPS = ['ADULT', 'CHILD', 'TEEN', 'INFANT'] as const

const csvRowSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v))
    .pipe(z.string().email('Invalid email').optional()),
  phone: z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  ageGroup: z
    .string()
    .optional()
    .transform((v) => {
      const upper = (v ?? '').toUpperCase()
      return CSV_AGE_GROUPS.includes(upper as (typeof CSV_AGE_GROUPS)[number]) ? upper : 'ADULT'
    })
    .pipe(z.enum(CSV_AGE_GROUPS)),
  address1: z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  address2: z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  city: z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  state: z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  zipCode: z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  country: z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  notes: z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
})

type CsvRowInput = z.input<typeof csvRowSchema>
type CsvRowOutput = z.output<typeof csvRowSchema>

type ParsedRow = {
  rowNumber: number
  raw: CsvRowInput
} & (
  | { valid: true; data: CsvRowOutput }
  | { valid: false; errors: string[] }
)

// ---------------------------------------------------------------------------
// CSV template content
// ---------------------------------------------------------------------------
const CSV_HEADERS = [
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
  CSV_HEADERS.join(',') +
  '\nJohn,Smith,john@example.com,555-1234,ADULT,123 Main St,,New York,NY,10001,USA,\nJane,Doe,,,,,,,,,,\n'

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'guest-import-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
type CsvUploadDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  events: Event[]
}

type Step = 'upload' | 'preview'

export function CsvUploadDialog({ open, onOpenChange, events }: CsvUploadDialogProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState<string>('')

  const bulkCreateMutation = api.household.bulkCreate.useMutation({
    onSuccess: ({ created }) => {
      toast.success(`Successfully imported ${created} guest${created === 1 ? '' : 's'}!`)
      router.refresh()
      handleClose()
    },
    onError: () => {
      toast.error('Failed to import guests. Please try again.')
    },
  })

  const handleClose = useCallback(() => {
    onOpenChange(false)
    // Reset state after dialog animation
    setTimeout(() => {
      setStep('upload')
      setParsedRows([])
      setFileName('')
    }, 200)
  }, [onOpenChange])

  const parseFile = useCallback((file: File) => {
    setFileName(file.name)
    Papa.parse<CsvRowInput>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: ParsedRow[] = results.data.map((raw, index) => {
          const result = csvRowSchema.safeParse(raw)
          if (result.success) {
            return { rowNumber: index + 2, raw, valid: true, data: result.data }
          }
          const errors = result.error.issues.map((i) => i.message)
          return { rowNumber: index + 2, raw, valid: false, errors }
        })
        setParsedRows(rows)
        setStep('preview')
      },
    })
  }, [])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) parseFile(file)
    },
    [parseFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  })

  const validRows = parsedRows.filter((r): r is ParsedRow & { valid: true; data: CsvRowOutput } =>
    r.valid === true
  )
  const invalidRows = parsedRows.filter((r) => !r.valid)

  const handleImport = () => {
    if (validRows.length === 0) return

    // Build invites: all events → 'Not Invited'
    const invites = Object.fromEntries(events.map((e) => [e.id, 'Not Invited']))

    const households = validRows.map((row) => ({
      address1: row.data.address1,
      address2: row.data.address2,
      city: row.data.city,
      state: row.data.state,
      country: row.data.country,
      zipCode: row.data.zipCode,
      notes: row.data.notes,
      guestParty: [
        {
          firstName: row.data.firstName,
          lastName: row.data.lastName,
          email: row.data.email,
          phone: row.data.phone,
          ageGroup: row.data.ageGroup,
          isPrimaryContact: true,
          tagIds: [] as string[],
          invites,
        },
      ],
    }))

    bulkCreateMutation.mutate({ households })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-2xl'>
        {step === 'upload' ? (
          <>
            <DialogHeader>
              <DialogTitle>Import Guests from CSV</DialogTitle>
              <DialogDescription>
                Upload a CSV file to bulk-add guests. Each row becomes one household.
              </DialogDescription>
            </DialogHeader>

            <div
              {...getRootProps()}
              className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-12 transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }`}
            >
              <input {...getInputProps()} />
              <svg
                className='mb-3 h-10 w-10 text-muted-foreground'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                strokeWidth={1.5}
                aria-hidden='true'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5'
                />
              </svg>
              <p className='text-sm text-muted-foreground'>
                {isDragActive ? 'Drop your CSV here' : 'Drag & drop a CSV file, or click to browse'}
              </p>
              <p className='mt-1 text-xs text-muted-foreground/70'>.csv files only</p>
            </div>

            <DialogFooter className='mt-2 flex-row items-center justify-between sm:justify-between'>
              <Button variant='ghost' size='sm' type='button' onClick={downloadTemplate}>
                Download Template
              </Button>
              <Button variant='outline' type='button' onClick={handleClose}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Preview Import</DialogTitle>
              <DialogDescription>
                {fileName} &mdash; {validRows.length} valid row
                {validRows.length !== 1 ? 's' : ''}
                {invalidRows.length > 0 && (
                  <span className='text-destructive'>
                    {' '}
                    &middot; {invalidRows.length} row{invalidRows.length !== 1 ? 's' : ''} with
                    errors (will be skipped)
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className='max-h-80 overflow-auto rounded-md border'>
              <table className='w-full text-sm'>
                <thead className='sticky top-0 bg-muted'>
                  <tr>
                    <th className='px-3 py-2 text-left font-medium text-muted-foreground'>#</th>
                    <th className='px-3 py-2 text-left font-medium text-muted-foreground'>
                      First Name
                    </th>
                    <th className='px-3 py-2 text-left font-medium text-muted-foreground'>
                      Last Name
                    </th>
                    <th className='px-3 py-2 text-left font-medium text-muted-foreground'>Email</th>
                    <th className='px-3 py-2 text-left font-medium text-muted-foreground'>Age Group</th>
                    <th className='px-3 py-2 text-left font-medium text-muted-foreground'>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={
                        row.valid
                          ? 'border-t border-border'
                          : 'border-t border-border bg-destructive/5'
                      }
                    >
                      <td className='px-3 py-2 text-muted-foreground'>{row.rowNumber}</td>
                      <td className='px-3 py-2'>{row.raw.firstName || '—'}</td>
                      <td className='px-3 py-2'>{row.raw.lastName || '—'}</td>
                      <td className='px-3 py-2 text-muted-foreground'>{row.raw.email || '—'}</td>
                      <td className='px-3 py-2 text-muted-foreground'>
                        {row.raw.ageGroup || 'ADULT'}
                      </td>
                      <td className='px-3 py-2'>
                        {row.valid ? (
                          <span className='font-medium text-success text-xs'>Valid</span>
                        ) : (
                          <span
                            className='font-medium text-destructive text-xs'
                            title={row.errors.join('; ')}
                          >
                            Error: {row.errors[0]}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <DialogFooter className='mt-2 flex-row items-center justify-between sm:justify-between'>
              <Button
                variant='ghost'
                size='sm'
                type='button'
                onClick={() => setStep('upload')}
                disabled={bulkCreateMutation.isPending}
              >
                Back
              </Button>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  type='button'
                  onClick={handleClose}
                  disabled={bulkCreateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type='button'
                  onClick={handleImport}
                  disabled={validRows.length === 0 || bulkCreateMutation.isPending}
                >
                  {bulkCreateMutation.isPending
                    ? 'Importing…'
                    : `Import ${validRows.length} Guest${validRows.length !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
