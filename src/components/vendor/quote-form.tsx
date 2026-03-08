'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { useUploadThing } from '~/lib/uploadthing'
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

export function QuoteForm({ vendorId, onSuccess, onCancel, mode = 'create', quote }: QuoteFormProps) {
  const isEdit = mode === 'edit' && quote
  const [price, setPrice] = useState(isEdit ? String(quote.price) : '')
  const [quoteDate, setQuoteDate] = useState(isEdit ? toDateInputValue(quote.quoteDate) : getTodayString())
  const [notes, setNotes] = useState(isEdit ? (quote.notes ?? '') : '')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const utils = api.useUtils()

  const addQuote = api.vendor.addQuote.useMutation()
  const updateQuote = api.vendor.updateQuote.useMutation()
  const saveFiles = api.vendor.saveQuoteFiles.useMutation()

  const { startUpload, isUploading } = useUploadThing('vendorQuoteFile', {
    onUploadError: () => { toast.error('Failed to upload files') },
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
        // 1. Create the quote
        const newQuote = await addQuote.mutateAsync({
          vendorId,
          price: parseFloat(price),
          quoteDate,
          notes: notes || undefined,
        })

        // 2. Upload files if any
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
    <form onSubmit={handleSubmit} className='flex flex-col gap-3 rounded-lg border border-border/90 p-4'>
      <h4 className='font-semibold text-foreground text-sm'>{isEdit ? 'Edit Quote' : 'New Quote'}</h4>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <div>
          <Label htmlFor='price' className='text-xs'>
            Price ($)
          </Label>
          <Input
            id='price'
            type='number'
            min='0.01'
            step='0.01'
            placeholder='0.00'
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className='mt-1 h-8 text-sm'
          />
        </div>
        <div>
          <Label htmlFor='quoteDate' className='text-xs'>
            Date
          </Label>
          <Input
            id='quoteDate'
            type='date'
            value={quoteDate}
            onChange={(e) => setQuoteDate(e.target.value)}
            required
            className='mt-1 h-8 text-sm'
          />
        </div>
      </div>
      <div>
        <Label htmlFor='notes' className='text-xs'>
          Notes
        </Label>
        <Textarea
          id='notes'
          placeholder='Package details, inclusions, conditions...'
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className='mt-1 text-sm'
        />
      </div>

      {/* File upload dropzone — only for new quotes */}
      {!isEdit && (
        <div>
          <Label className='text-xs'>Attachments</Label>
          <div
            {...getRootProps()}
            className={`mt-1 cursor-pointer rounded-md border-2 border-dashed p-3 text-center text-xs transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
            }`}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className='text-primary'>Drop files here...</p>
            ) : (
              <p className='text-muted-foreground'>
                Drag & drop files, or click to browse
                <br />
                <span className='text-[10px]'>PDF, images, Word, Excel, text — max 8MB each</span>
              </p>
            )}
          </div>

          {/* Selected files list */}
          {selectedFiles.length > 0 && (
            <ul className='mt-2 space-y-1'>
              {selectedFiles.map((file, i) => (
                <li
                  key={`${file.name}-${i}`}
                  className='flex items-center justify-between rounded bg-muted px-2 py-1 text-xs'
                >
                  <span className='truncate'>{file.name}</span>
                  <button
                    type='button'
                    onClick={() => removeFile(i)}
                    className='ml-2 shrink-0 text-foreground/40 hover:text-destructive'
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
        <Button
          type='submit'
          size='sm'
          disabled={busy}
          className='bg-primary text-primary-foreground hover:bg-primary/90'
        >
          {busy
            ? (isUploading ? 'Uploading...' : 'Saving...')
            : isEdit ? 'Save Changes' : 'Add Quote'
          }
        </Button>
      </div>
    </form>
  )
}
