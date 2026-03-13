'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { useUploadThing } from '~/lib/uploadthing'
import { cn } from '~/lib/utils'
import type { VendorQuote } from '~/server/domains/vendor/vendor.types'
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

  const { startUpload, isUploading } = useUploadThing('vendorQuoteFile', {
    onUploadError: () => {
      toast.error('Failed to upload files')
    },
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles((prev) => {
      const combined = [...prev, ...acceptedFiles]
      if (combined.length > 10) {
        toast.error('Maximum 10 files per quote')
        return prev
      }
      return combined
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 8 * 1024 * 1024,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    onDropRejected: (rejections) => {
      const msg = rejections[0]?.errors[0]?.message ?? 'File not accepted'
      toast.error(msg)
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
          quoteDate,
          notes: notes || undefined,
        })

        if (selectedFiles.length > 0) {
          const uploadResults = await startUpload(selectedFiles)
          if (uploadResults && uploadResults.length > 0) {
            await saveFiles.mutateAsync({
              quoteId: newQuote.id,
              vendorId,
              files: uploadResults.map((r) => ({
                name: r.name,
                url: r.ufsUrl,
                key: r.key,
                size: r.size,
              })),
            })
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

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <label htmlFor='quote-price' className='space-y-1'>
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
        <label htmlFor='quote-date' className='space-y-1'>
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

      <label htmlFor='quote-notes' className='space-y-1'>
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
              <p className='font-mono text-[0.62rem] text-muted-foreground uppercase tracking-wider'>
                Drag & drop files, or click to browse
              </p>
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
