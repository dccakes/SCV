'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'

import {
  SIDE_PANE_DIALOG_WIDTH_CLASS,
  SIDE_PANE_OVERLAY_CLASS,
  SIDE_PANE_SURFACE_CLASS,
} from '~/components/layout/side-pane-styles'
import { QuoteForm } from '~/components/vendor/quote-form'
import { VendorForm } from '~/components/vendor/vendor-form'
import { VendorStatusSelect } from '~/components/vendor/vendor-status-select'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '~/components/ui/dialog'
import { useUploadThing } from '~/lib/uploadthing'
import type { VendorQuote, VendorWithQuotes } from '~/server/domains/vendor/vendor.types'
import { api } from '~/trpc/react'

type VendorDetailPanelProps = {
  vendor: VendorWithQuotes | null
  onClose: () => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function QuoteFileUploader({
  quoteId,
  vendorId,
  onUploaded,
}: {
  quoteId: string
  vendorId: string
  onUploaded: () => void
}) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const saveFiles = api.vendor.saveQuoteFiles.useMutation()

  const { startUpload, isUploading } = useUploadThing('vendorQuoteFile', {
    onUploadError: () => { toast.error('Failed to upload files') },
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles((prev) => {
      const combined = [...prev, ...acceptedFiles]
      if (combined.length > 10) {
        toast.error('Maximum 10 files per upload')
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

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return
    setIsSubmitting(true)
    try {
      const uploadResults = await startUpload(selectedFiles)
      if (uploadResults && uploadResults.length > 0) {
        await saveFiles.mutateAsync({
          quoteId,
          vendorId,
          files: uploadResults.map((r) => ({
            name: r.name,
            url: r.ufsUrl,
            key: r.key,
            size: r.size,
          })),
        })
      }
      toast.success('Files uploaded')
      setSelectedFiles([])
      onUploaded()
    } catch {
      toast.error('Failed to upload files')
    } finally {
      setIsSubmitting(false)
    }
  }

  const busy = isSubmitting || isUploading

  return (
    <div className='mt-2 space-y-2'>
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-md border-2 border-dashed p-3 text-center text-xs transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
        }`}
      >
        <input {...getInputProps()} />
        <p className='text-muted-foreground'>
          {isDragActive ? 'Drop files here...' : 'Drag & drop or click to attach files'}
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <>
          <ul className='space-y-1'>
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
          <Button size='sm' className='h-7 text-xs' onClick={handleUpload} disabled={busy}>
            {busy ? 'Uploading...' : `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`}
          </Button>
        </>
      )}
    </div>
  )
}

export function VendorDetailPanel({ vendor, onClose }: VendorDetailPanelProps) {
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null)
  const [attachingQuoteId, setAttachingQuoteId] = useState<string | null>(null)
  const utils = api.useUtils()

  const { data: vendorData, refetch } = api.vendor.getById.useQuery(
    { vendorId: vendor?.id ?? '' },
    { enabled: !!vendor?.id, initialData: vendor ?? undefined }
  )

  const updateStatus = api.vendor.updateStatus.useMutation({
    onSuccess: async () => {
      await refetch()
      await utils.vendor.getAll.invalidate()
    },
    onError: () => toast.error('Failed to update status'),
  })

  const deleteQuote = api.vendor.deleteQuote.useMutation({
    onSuccess: async () => {
      await refetch()
      toast.success('Quote removed')
    },
    onError: () => toast.error('Failed to delete quote'),
  })

  const deleteFile = api.vendor.deleteQuoteFile.useMutation({
    onSuccess: async () => {
      await refetch()
      toast.success('File removed')
    },
    onError: () => toast.error('Failed to delete file'),
  })

  if (!vendor || !vendorData) return null

  const formatPrice = (price: unknown) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(price))

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <Dialog open={!!vendor} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className={SIDE_PANE_OVERLAY_CLASS} />
        <DialogPrimitive.Content
          className={`fixed inset-0 z-50 flex h-screen w-screen max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden p-0 outline-none ${SIDE_PANE_SURFACE_CLASS} md:inset-y-0 md:right-0 md:left-auto md:h-full md:translate-x-0 md:translate-y-0 md:p-6 ${SIDE_PANE_DIALOG_WIDTH_CLASS}`}
        >
          <DialogClose
            aria-label='Close vendor details'
            className='absolute top-4 right-4 z-10 rounded-full border border-border/80 bg-card p-1.5 opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          >
            <X className='h-4 w-4' aria-hidden='true' />
          </DialogClose>

          <header className='border-border/80 border-b px-5 py-5 pr-14 md:px-6'>
            <DialogTitle className='font-semibold text-xl text-foreground'>
              {vendorData.name}
            </DialogTitle>
            <DialogDescription className='sr-only'>Vendor details panel</DialogDescription>
          </header>

          <div className='flex min-h-0 flex-1 flex-col'>
            <div className='flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 md:px-6'>
              {showEditForm ? (
                <VendorForm
                  mode='edit'
                  vendor={vendorData}
                  onSuccess={async () => {
                    await refetch()
                    await utils.vendor.getAll.invalidate()
                    setShowEditForm(false)
                  }}
                  onCancel={() => setShowEditForm(false)}
                />
              ) : (
                <div className='flex flex-col gap-5'>
                  {/* Status */}
                  <div className='flex items-center gap-3'>
                    <span className='text-foreground/60 text-sm'>Status:</span>
                    <VendorStatusSelect
                      value={vendorData.status}
                      onChange={(status) => updateStatus.mutate({ vendorId: vendorData.id, status })}
                      disabled={updateStatus.isPending}
                    />
                  </div>

                  {/* Details */}
                  <div className='grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2'>
                    {vendorData.location && (
                      <>
                        <span className='text-foreground/60'>Location</span>
                        <span>{vendorData.location}</span>
                      </>
                    )}
                    {vendorData.website && (
                      <>
                        <span className='text-foreground/60'>Website</span>
                        <a
                          href={vendorData.website}
                          target='_blank'
                          rel='noreferrer'
                          className='truncate text-primary hover:underline'
                        >
                          {vendorData.website}
                        </a>
                      </>
                    )}
                    {vendorData.instagram && (
                      <>
                        <span className='text-foreground/60'>Instagram</span>
                        <span>{vendorData.instagram}</span>
                      </>
                    )}
                  </div>

                  {/* Contact */}
                  {(vendorData.contactName || vendorData.contactEmail || vendorData.contactPhone) && (
                    <div>
                      <p className='mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide'>
                        Contact
                      </p>
                      <div className='grid grid-cols-1 gap-x-8 gap-y-1 text-sm sm:grid-cols-2'>
                        {vendorData.contactName && (
                          <>
                            <span className='text-foreground/60'>Name</span>
                            <span>{vendorData.contactName}</span>
                          </>
                        )}
                        {vendorData.contactEmail && (
                          <>
                            <span className='text-foreground/60'>Email</span>
                            <a
                              href={`mailto:${vendorData.contactEmail}`}
                              className='text-primary hover:underline'
                            >
                              {vendorData.contactEmail}
                            </a>
                          </>
                        )}
                        {vendorData.contactPhone && (
                          <>
                            <span className='text-foreground/60'>Phone</span>
                            <span>{vendorData.contactPhone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quotes */}
                  <div>
                    <div className='mb-2 flex items-center justify-between'>
                      <p className='font-semibold text-muted-foreground text-xs uppercase tracking-wide'>
                        Quotes ({vendorData.quotes.length})
                      </p>
                      {!showQuoteForm && (
                        <Button
                          size='sm'
                          variant='outline'
                          className='h-7 text-xs'
                          onClick={() => setShowQuoteForm(true)}
                        >
                          + Add Quote
                        </Button>
                      )}
                    </div>

                    {showQuoteForm && (
                      <QuoteForm
                        vendorId={vendorData.id}
                        onSuccess={async () => {
                          await refetch()
                          setShowQuoteForm(false)
                        }}
                        onCancel={() => setShowQuoteForm(false)}
                      />
                    )}

                    {vendorData.quotes.length === 0 && !showQuoteForm && (
                      <p className='text-muted-foreground text-sm'>No quotes yet.</p>
                    )}

                    {vendorData.quotes.length > 0 && (
                      <div className='flex flex-col gap-2'>
                        {vendorData.quotes.map((quote: VendorQuote) => (
                          <div key={quote.id} className='rounded-lg border px-4 py-3'>
                            {editingQuoteId === quote.id ? (
                              <QuoteForm
                                vendorId={vendorData.id}
                                mode='edit'
                                quote={quote}
                                onSuccess={async () => {
                                  await refetch()
                                  setEditingQuoteId(null)
                                }}
                                onCancel={() => setEditingQuoteId(null)}
                              />
                            ) : (
                              <>
                                <div className='flex items-start justify-between'>
                                  <div>
                                    <p className='font-semibold text-foreground'>{formatPrice(quote.price)}</p>
                                    <p className='text-foreground/50 text-xs'>{formatDate(quote.quoteDate)}</p>
                                    {quote.notes && (
                                      <p className='mt-1 text-foreground/70 text-sm'>{quote.notes}</p>
                                    )}
                                  </div>
                                  <div className='ml-4 flex items-center gap-2'>
                                    <button
                                      type='button'
                                      className='text-foreground/50 text-xs hover:text-primary'
                                      onClick={() => setEditingQuoteId(quote.id)}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type='button'
                                      className='text-destructive/70 text-xs hover:text-destructive'
                                      onClick={() => {
                                        if (window.confirm('Remove this quote and all its attached files?')) {
                                          deleteQuote.mutate({ quoteId: quote.id, vendorId: vendorData.id })
                                        }
                                      }}
                                      disabled={deleteQuote.isPending}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>

                                {/* Attached files */}
                                {quote.files.length > 0 && (
                                  <div className='mt-2 space-y-1'>
                                    {quote.files.map((file) => (
                                      <div
                                        key={file.id}
                                        className='flex items-center gap-2 rounded bg-muted px-2 py-1 text-xs'
                                      >
                                        <a
                                          href={file.url}
                                          target='_blank'
                                          rel='noreferrer'
                                          className='min-w-0 flex-1 truncate text-primary hover:underline'
                                        >
                                          {file.name}
                                        </a>
                                        <span className='shrink-0 text-foreground/40'>
                                          {formatFileSize(file.size)}
                                        </span>
                                        <button
                                          type='button'
                                          onClick={() => {
                                            if (window.confirm(`Remove "${file.name}"?`)) {
                                              deleteFile.mutate({
                                                fileId: file.id,
                                                quoteId: quote.id,
                                                vendorId: vendorData.id,
                                              })
                                            }
                                          }}
                                          disabled={deleteFile.isPending}
                                          className='shrink-0 text-foreground/40 hover:text-destructive'
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Attach more files */}
                                {attachingQuoteId === quote.id ? (
                                  <QuoteFileUploader
                                    quoteId={quote.id}
                                    vendorId={vendorData.id}
                                    onUploaded={async () => {
                                      await refetch()
                                      setAttachingQuoteId(null)
                                    }}
                                  />
                                ) : (
                                  <button
                                    type='button'
                                    className='mt-2 flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1.5 text-muted-foreground text-xs transition-colors hover:border-primary/40 hover:text-primary'
                                    onClick={() => setAttachingQuoteId(quote.id)}
                                  >
                                    + Attach files
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className='flex justify-between border-t pt-3'>
                    <Button variant='outline' size='sm' onClick={() => setShowEditForm(true)}>
                      Edit Details
                    </Button>
                    <Button variant='outline' size='sm' onClick={onClose}>
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}
