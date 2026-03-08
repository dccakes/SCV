'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { Event } from '~/app/utils/shared-types'
import {
  downloadGuestCsvTemplate,
  type GuestCsvRowOutput,
  type ParsedCsvRow,
  parseCsvFile,
} from '~/components/guest-list/guest-csv-import.schema'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { FileDropzone } from '~/components/ui/file-dropzone'
import { api } from '~/trpc/react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = 'upload' | 'preview'

type ValidRow = ParsedCsvRow & { valid: true; data: GuestCsvRowOutput }

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type PreviewTableProps = { rows: ParsedCsvRow[] }

function PreviewTable({ rows }: PreviewTableProps) {
  return (
    <div className='max-h-80 overflow-auto rounded-md border'>
      <table className='w-full text-sm'>
        <thead className='sticky top-0 bg-muted'>
          <tr>
            {['#', 'First Name', 'Last Name', 'Email', 'Age Group', 'Status'].map((h) => (
              <th key={h} className='px-3 py-2 text-left font-medium text-muted-foreground'>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.rowNumber}
              className={
                row.valid ? 'border-t border-border' : 'border-t border-border bg-destructive/5'
              }
            >
              <td className='px-3 py-2 text-muted-foreground'>{row.rowNumber}</td>
              <td className='px-3 py-2'>{row.raw.firstName || '—'}</td>
              <td className='px-3 py-2'>{row.raw.lastName || '—'}</td>
              <td className='px-3 py-2 text-muted-foreground'>{row.raw.email || '—'}</td>
              <td className='px-3 py-2 text-muted-foreground'>{row.raw.ageGroup || 'ADULT'}</td>
              <td className='px-3 py-2'>
                {row.valid ? (
                  <span className='font-medium text-success text-xs'>Valid</span>
                ) : (
                  <span className='font-medium text-destructive text-xs'>
                    {row.errors.join('; ')}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main dialog
// ---------------------------------------------------------------------------

type CsvUploadDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  events: Event[]
}

export function CsvUploadDialog({ open, onOpenChange, events }: CsvUploadDialogProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')
  const [parsedRows, setParsedRows] = useState<ParsedCsvRow[]>([])
  const [fileName, setFileName] = useState('')
  const [isParsing, setIsParsing] = useState(false)

  const validRows = parsedRows.filter((r): r is ValidRow => r.valid)
  const invalidCount = parsedRows.length - validRows.length

  // Reset dialog state when it closes
  useEffect(() => {
    if (!open) {
      setStep('upload')
      setParsedRows([])
      setFileName('')
      setIsParsing(false)
    }
  }, [open])

  const bulkCreateMutation = api.household.bulkCreate.useMutation({
    onSuccess: ({ created, failed }) => {
      if (failed > 0) {
        toast.warning(
          `Imported ${created} guest${created === 1 ? '' : 's'}, ${failed} skipped due to errors.`
        )
      } else {
        toast.success(`Successfully imported ${created} guest${created === 1 ? '' : 's'}!`)
      }
      router.refresh()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to import guests. Please try again.')
    },
  })

  const handleClose = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name)
    setIsParsing(true)
    try {
      const rows = await parseCsvFile(file)
      setParsedRows(rows)
      setStep('preview')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse CSV file'
      toast.error(message)
    } finally {
      setIsParsing(false)
    }
  }, [])

  const handleImport = () => {
    if (validRows.length === 0) return
    const invites = Object.fromEntries(events.map((e) => [e.id, 'Not Invited']))
    const households = validRows.map(({ data }) => ({
      address1: data.address1,
      address2: data.address2,
      city: data.city,
      state: data.state,
      country: data.country,
      zipCode: data.zipCode,
      notes: data.notes,
      guestParty: [
        {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          ageGroup: data.ageGroup,
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

            <FileDropzone
              onFile={handleFile}
              accept={{ 'text/csv': ['.csv'] }}
              label='Drag & drop a CSV file, or click to browse'
              sublabel='.csv files only'
              disabled={isParsing}
            />

            <DialogFooter className='mt-2 flex-row items-center justify-between sm:justify-between'>
              <Button variant='ghost' size='sm' type='button' onClick={downloadGuestCsvTemplate}>
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
                {fileName} &mdash; {validRows.length} valid row{validRows.length !== 1 ? 's' : ''}
                {invalidCount > 0 && (
                  <span className='text-destructive'>
                    {' '}
                    &middot; {invalidCount} row{invalidCount !== 1 ? 's' : ''} with errors (will be
                    skipped)
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <PreviewTable rows={parsedRows} />

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
