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
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '~/components/ui/dialog'
import { QuoteForm } from '~/components/vendor/quote-form'
import { VendorForm } from '~/components/vendor/vendor-form'
import { VendorStatusSelect } from '~/components/vendor/vendor-status-select'
import { uploadFiles } from '~/lib/blob'
import {
  ACCEPTED_TYPES_LABEL,
  DROPZONE_ACCEPT,
  MAX_FILE_SIZE,
  MAX_FILES_PER_QUOTE,
} from '~/lib/upload-config'
import { cn } from '~/lib/utils'
import type { VendorQuote, VendorWithQuotes } from '~/server/domains/vendor/vendor.types'
import { QuoteType } from '~/server/domains/vendor/vendor.types'
import { api } from '~/trpc/react'

type VendorDetailPanelProps = {
  vendor: VendorWithQuotes | null
  onClose: () => void
}

const priceFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Hairline-rule section label matching OSWP drawer pattern */
function SectionLabel({
  children,
  action,
}: {
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className='mb-2.5 flex items-center gap-3'>
      <h3 className='shrink-0 font-mono text-[0.58rem] text-muted-foreground uppercase tracking-widest'>
        {children}
      </h3>
      <span className='h-px flex-1 bg-border' aria-hidden='true' />
      {action ? <div className='shrink-0'>{action}</div> : null}
    </div>
  )
}

/** Detail grid label */
function DetailLabel({ children }: { children: React.ReactNode }) {
  return (
    <dt className='font-mono text-[0.55rem] text-muted-foreground uppercase tracking-widest'>
      {children}
    </dt>
  )
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

  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles((prev) => {
      const combined = [...prev, ...acceptedFiles]
      if (combined.length > MAX_FILES_PER_QUOTE) {
        toast.error(`Maximum ${MAX_FILES_PER_QUOTE} files per upload`)
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

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return
    setIsSubmitting(true)
    setIsUploading(true)
    try {
      const uploadResults = await uploadFiles(selectedFiles)
      if (uploadResults.length > 0) {
        await saveFiles.mutateAsync({
          quoteId,
          vendorId,
          files: uploadResults.map((r) => ({
            name: r.name,
            url: r.url,
            key: r.pathname,
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
      setIsUploading(false)
    }
  }

  const busy = isSubmitting || isUploading

  return (
    <div className='mt-2 space-y-2'>
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
              Drag & drop or click to attach
            </p>
            <p className='font-mono text-[0.5rem] text-muted-foreground/70 tracking-wider'>
              {ACCEPTED_TYPES_LABEL} — max 8 MB each
            </p>
          </div>
        )}
      </div>

      {selectedFiles.length > 0 && (
        <>
          <ul className='space-y-1'>
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
          <Button size='sm' onClick={handleUpload} disabled={busy}>
            {busy
              ? 'Uploading...'
              : `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`}
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
      await Promise.all([refetch(), utils.vendor.getAll.invalidate()])
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

  const formatPrice = (price: number) => priceFormatter.format(price)
  const formatDate = (date: Date | string) => dateFormatter.format(new Date(date))

  return (
    <Dialog open={!!vendor} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className={SIDE_PANE_OVERLAY_CLASS} />
        <DialogPrimitive.Content
          className={cn(
            `fixed inset-0 z-50 flex h-screen w-screen max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden p-0 pb-0 outline-none ${SIDE_PANE_SURFACE_CLASS}`,
            `md:inset-y-0 md:right-0 md:left-auto md:h-full md:translate-x-0 md:translate-y-0 md:p-6 ${SIDE_PANE_DIALOG_WIDTH_CLASS}`
          )}
        >
          <DialogClose
            aria-label='Close vendor details'
            className='absolute top-4 right-4 z-10 rounded-full border border-border/80 bg-card p-1.5 opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          >
            <X className='h-4 w-4' aria-hidden='true' />
          </DialogClose>

          {/* Header */}
          <header className='border-border/80 border-b px-5 py-5 pr-14 md:px-6'>
            <DialogTitle className='font-display text-2xl text-foreground italic leading-tight'>
              {vendorData.name}
            </DialogTitle>
            <DialogDescription className='sr-only'>Vendor details panel</DialogDescription>
            <div className='mt-2'>
              <VendorStatusSelect
                value={vendorData.status}
                onChange={(status) => updateStatus.mutate({ vendorId: vendorData.id, status })}
                disabled={updateStatus.isPending}
              />
            </div>
          </header>

          {/* Scrollable body */}
          <div className='flex min-h-0 flex-1 flex-col'>
            <div className='flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 md:px-6'>
              {showEditForm ? (
                <VendorForm
                  mode='edit'
                  vendor={vendorData}
                  onSuccess={async () => {
                    await Promise.all([refetch(), utils.vendor.getAll.invalidate()])
                    setShowEditForm(false)
                  }}
                  onCancel={() => setShowEditForm(false)}
                />
              ) : (
                <div className='space-y-5'>
                  {/* Details section */}
                  <section>
                    <SectionLabel
                      action={
                        <button
                          type='button'
                          onClick={() => setShowEditForm(true)}
                          className='font-mono text-[0.58rem] text-primary uppercase tracking-wider hover:underline'
                        >
                          Edit
                        </button>
                      }
                    >
                      Details
                    </SectionLabel>
                    <dl className='grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2'>
                      {vendorData.location && (
                        <div>
                          <DetailLabel>Location</DetailLabel>
                          <dd className='font-sans text-[0.92rem] text-foreground'>
                            {vendorData.location}
                          </dd>
                        </div>
                      )}
                      {vendorData.website && (
                        <div>
                          <DetailLabel>Website</DetailLabel>
                          <dd>
                            <a
                              href={vendorData.website}
                              target='_blank'
                              rel='noreferrer'
                              className='truncate font-sans text-[0.92rem] text-primary hover:underline'
                            >
                              {vendorData.website}
                            </a>
                          </dd>
                        </div>
                      )}
                      {vendorData.instagram && (
                        <div>
                          <DetailLabel>Instagram</DetailLabel>
                          <dd className='font-sans text-[0.92rem] text-foreground'>
                            {vendorData.instagram}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </section>

                  {/* Contact section */}
                  {(vendorData.contactName ||
                    vendorData.contactEmail ||
                    vendorData.contactPhone) && (
                    <section>
                      <SectionLabel>Contact</SectionLabel>
                      <dl className='grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2'>
                        {vendorData.contactName && (
                          <div>
                            <DetailLabel>Name</DetailLabel>
                            <dd className='font-sans text-[0.92rem] text-foreground'>
                              {vendorData.contactName}
                            </dd>
                          </div>
                        )}
                        {vendorData.contactEmail && (
                          <div>
                            <DetailLabel>Email</DetailLabel>
                            <dd>
                              <a
                                href={`mailto:${vendorData.contactEmail}`}
                                className='font-sans text-[0.92rem] text-primary hover:underline'
                              >
                                {vendorData.contactEmail}
                              </a>
                            </dd>
                          </div>
                        )}
                        {vendorData.contactPhone && (
                          <div>
                            <DetailLabel>Phone</DetailLabel>
                            <dd className='font-sans text-[0.92rem] text-foreground'>
                              {vendorData.contactPhone}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </section>
                  )}

                  {/* Quotes section */}
                  <section>
                    <SectionLabel
                      action={
                        !showQuoteForm ? (
                          <button
                            type='button'
                            onClick={() => setShowQuoteForm(true)}
                            className='font-mono text-[0.58rem] text-primary uppercase tracking-wider hover:underline'
                          >
                            + Add Quote
                          </button>
                        ) : null
                      }
                    >
                      Quotes ({vendorData.quotes.length})
                    </SectionLabel>

                    {showQuoteForm && (
                      <div className='mb-3'>
                        <QuoteForm
                          vendorId={vendorData.id}
                          onSuccess={async () => {
                            await refetch()
                            setShowQuoteForm(false)
                          }}
                          onCancel={() => setShowQuoteForm(false)}
                        />
                      </div>
                    )}

                    {vendorData.quotes.length === 0 && !showQuoteForm && (
                      <p className='font-mono text-[0.72rem] text-muted-foreground uppercase tracking-wider'>
                        No quotes yet
                      </p>
                    )}

                    {vendorData.quotes.length > 0 && (
                      <div className='space-y-2'>
                        {vendorData.quotes.map((quote: VendorQuote) => (
                          <div
                            key={quote.id}
                            className='rounded-lg border border-border/90 bg-card/60 px-4 py-3'
                          >
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
                                    <div className='flex items-baseline gap-2'>
                                      <p className='font-display text-foreground text-xl italic'>
                                        {formatPrice(quote.price)}
                                      </p>
                                      <span className='font-mono text-[0.55rem] text-muted-foreground uppercase tracking-wider'>
                                        {quote.quoteType === QuoteType.PER_GUEST
                                          ? '/ guest'
                                          : 'flat fee'}
                                      </span>
                                    </div>
                                    <p className='font-mono text-[0.55rem] text-muted-foreground lowercase tracking-wider'>
                                      {formatDate(quote.quoteDate)}
                                    </p>
                                    {quote.notes && (
                                      <p className='mt-1.5 font-sans text-[0.88rem] text-foreground/75 leading-relaxed'>
                                        {quote.notes}
                                      </p>
                                    )}
                                  </div>
                                  <div className='ml-4 flex items-center gap-2'>
                                    <button
                                      type='button'
                                      className='font-mono text-[0.58rem] text-muted-foreground uppercase tracking-wider hover:text-primary'
                                      onClick={() => setEditingQuoteId(quote.id)}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type='button'
                                      className='font-mono text-[0.58rem] text-destructive/70 uppercase tracking-wider hover:text-destructive'
                                      onClick={() => {
                                        if (
                                          window.confirm(
                                            'Remove this quote and all its attached files?'
                                          )
                                        ) {
                                          deleteQuote.mutate({
                                            quoteId: quote.id,
                                            vendorId: vendorData.id,
                                          })
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
                                  <div className='mt-2.5 space-y-1'>
                                    {quote.files.map((file) => (
                                      <div
                                        key={file.id}
                                        className='flex items-center gap-2 rounded bg-muted px-2.5 py-1.5'
                                      >
                                        <a
                                          href={file.url}
                                          target='_blank'
                                          rel='noreferrer'
                                          className='min-w-0 flex-1 truncate font-sans text-[0.85rem] text-primary hover:underline'
                                        >
                                          {file.name}
                                        </a>
                                        <span className='shrink-0 font-mono text-[0.55rem] text-muted-foreground lowercase tracking-wider'>
                                          {formatFileSize(file.size)}
                                        </span>
                                        <button
                                          type='button'
                                          aria-label={`Remove ${file.name}`}
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
                                          className='shrink-0 text-muted-foreground hover:text-destructive'
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
                                    className='mt-2.5 rounded-md border border-primary/30 border-dashed px-2.5 py-1.5 font-mono text-[0.58rem] text-primary uppercase tracking-wider transition-colors hover:border-primary hover:bg-primary/5'
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
                  </section>
                </div>
              )}
            </div>

            {/* Footer */}
            <footer className='flex gap-3 border-border/80 border-t px-5 py-4 md:px-6'>
              <Button variant='outline' className='flex-1' onClick={() => setShowEditForm(true)}>
                Edit Details
              </Button>
              <Button variant='outline' className='flex-1' onClick={onClose}>
                Close
              </Button>
            </footer>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}
