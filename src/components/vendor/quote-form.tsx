'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { uploadFiles } from '~/lib/blob'
import {
  ACCEPTED_TYPES_LABEL,
  DROPZONE_ACCEPT,
  MAX_FILE_SIZE,
  MAX_FILES_PER_QUOTE,
} from '~/lib/upload-config'
import { cn } from '~/lib/utils'
import type { VendorQuote } from '~/server/domains/vendor/vendor.types'
import { QuoteType } from '~/server/domains/vendor/vendor.types'
import { api } from '~/trpc/react'

function getTodayString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function toDateInputValue(date: Date | string) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type QuoteFormProps = {
  vendorId: string
  onSuccess: () => void
  onCancel: () => void
  mode?: 'create' | 'edit'
  quote?: VendorQuote
}

export function QuoteForm({
  vendorId,
  onSuccess,
  onCancel,
  mode = 'create',
  quote,
}: QuoteFormProps) {
  const isEdit = mode === 'edit' && quote
  const [price, setPrice] = useState(isEdit ? String(quote.price) : '')
  const [quoteType, setQuoteType] = useState<QuoteType>(
    isEdit ? quote.quoteType : QuoteType.FLAT_FEE
  )
  const [quoteDate, setQuoteDate] = useState(
    isEdit ? toDateInputValue(quote.quoteDate) : getTodayString()
  )
  const [notes, setNotes] = useState(isEdit ? (quote.notes ?? '') : '')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const utils = api.useUtils()

  const addQuote = api.vendor.addQuote.useMutation()
  const updateQuote = api.vendor.updateQuote.useMutation()
  const saveFiles = api.vendor.saveQuoteFiles.useMutation()

  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles((prev) => {
      const combined = [...prev, ...acceptedFiles]
      if (combined.length > MAX_FILES_PER_QUOTE) {
        toast.error(`Maximum ${MAX_FILES_PER_QUOTE} files per quote`)
        return prev
      }
      return combined
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: MAX_FILE_SIZE,
    accept: DROPZONE_ACCEPT,
    onDropRejected: (rejections) => {
      const errors = rejections[0]?.errors
      if (errors?.some((e) => e.code === 'file-too-large')) {
        toast.error('File exceeds 8 MB limit')
      } else if (errors?.some((e) => e.code === 'file-invalid-type')) {
        toast.error(`Unsupported file type. Accepted: ${ACCEPTED_TYPES_LABEL}`)
      } else {
        toast.error(errors?.[0]?.message ?? 'File not accepted')
      }
    },
  })

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!price || !quoteDate) {
      toast.error('Price and date are required')
      return
    }

    setIsSubmitting(true)
    try {
      if (isEdit) {
        await updateQuote.mutateAsync({
          quoteId: quote.id,
          vendorId,
          price: parseFloat(price),
          quoteType,
          quoteDate,
          notes: notes || undefined,
        })
        await utils.vendor.getAll.invalidate()
        toast.success('Quote updated')
        onSuccess()
      } else {
        const newQuote = await addQuote.mutateAsync({
          vendorId,
          price: parseFloat(price),
          quoteType,
          quoteDate,
          notes: notes || undefined,
        })

        if (selectedFiles.length > 0) {
          setIsUploading(true)
          try {
            const uploadResults = await uploadFiles(selectedFiles)
            if (uploadResults.length > 0) {
              await saveFiles.mutateAsync({
                quoteId: newQuote.id,
                vendorId,
                files: uploadResults.map((r) => ({
                  name: r.name,
                  url: r.url,
                  key: r.pathname,
                  size: r.size,
                })),
              })
            }
          } finally {
            setIsUploading(false)
          }
        }

        await utils.vendor.getAll.invalidate()
        toast.success('Quote added')
        onSuccess()
      }
    } catch {
      toast.error(isEdit ? 'Failed to update quote' : 'Failed to add quote')
    } finally {
      setIsSubmitting(false)
    }
  }

  const busy = isSubmitting || isUploading

  return (
    <form
      onSubmit={handleSubmit}
      className='flex flex-col gap-3 rounded-lg border border-border/90 bg-card/60 p-4'
    >
      <h4 className='font-mono text-[0.58rem] text-muted-foreground uppercase tracking-widest'>
        {isEdit ? 'Edit Quote' : 'New Quote'}
      </h4>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <label className='space-y-1' htmlFor='quote-price'>
          <span className='font-mono text-[0.55rem] text-muted-foreground uppercase tracking-widest'>
            Price ($)
          </span>
          <Input
            id='quote-price'
            type='number'
            min='0.01'
            step='0.01'
            placeholder='0.00'
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className='h-9'
          />
        </label>
        <div className='space-y-1'>
          <span className='font-mono text-[0.55rem] text-muted-foreground uppercase tracking-widest'>
            Quote Type
          </span>
          <Select value={quoteType} onValueChange={(v) => setQuoteType(v as QuoteType)}>
            <SelectTrigger className='h-9'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={QuoteType.FLAT_FEE}>Flat Fee</SelectItem>
              <SelectItem value={QuoteType.PER_GUEST}>Per Guest</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className='space-y-1' htmlFor='quote-date'>
          <span className='font-mono text-[0.55rem] text-muted-foreground uppercase tracking-widest'>
            Date
          </span>
          <Input
            id='quote-date'
            type='date'
            value={quoteDate}
            onChange={(e) => setQuoteDate(e.target.value)}
            required
            className='h-9'
          />
        </label>
      </div>

      <label className='space-y-1' htmlFor='quote-notes'>
        <span className='font-mono text-[0.55rem] text-muted-foreground uppercase tracking-widest'>
          Notes
        </span>
        <Textarea
          id='quote-notes'
          placeholder='Package details, inclusions, conditions...'
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className='text-sm leading-relaxed'
        />
      </label>

      {/* File upload dropzone — only for new quotes */}
      {!isEdit && (
        <div className='space-y-1'>
          <span className='font-mono text-[0.55rem] text-muted-foreground uppercase tracking-widest'>
            Attachments
          </span>
          <div
            {...getRootProps()}
            className={cn(
              'cursor-pointer rounded-md border-2 border-dashed p-3 text-center transition-colors',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40 hover:bg-muted/30'
            )}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className='font-mono text-[0.62rem] text-primary uppercase tracking-wider'>
                Drop files here
              </p>
            ) : (
              <div className='space-y-0.5'>
                <p className='font-mono text-[0.62rem] text-muted-foreground uppercase tracking-wider'>
                  Drag & drop files, or click to browse
                </p>
                <p className='font-mono text-[0.5rem] text-muted-foreground/70 tracking-wider'>
                  {ACCEPTED_TYPES_LABEL} — max 8 MB each
                </p>
              </div>
            )}
          </div>

          {selectedFiles.length > 0 && (
            <ul className='mt-2 space-y-1'>
              {selectedFiles.map((file, i) => (
                <li
                  key={`${file.name}-${i}`}
                  className='flex items-center justify-between rounded bg-muted px-2.5 py-1.5 font-sans text-[0.85rem]'
                >
                  <span className='truncate'>{file.name}</span>
                  <button
                    type='button'
                    aria-label={`Remove ${file.name}`}
                    onClick={() => removeFile(i)}
                    className='ml-2 shrink-0 text-muted-foreground hover:text-destructive'
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className='flex gap-2 self-end'>
        <Button type='button' variant='outline' size='sm' onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type='submit' size='sm' disabled={busy}>
          {busy
            ? isUploading
              ? 'Uploading...'
              : 'Saving...'
            : isEdit
              ? 'Save Changes'
              : 'Add Quote'}
        </Button>
      </div>
    </form>
  )
}
