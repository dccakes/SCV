'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'

import { QuoteForm } from '~/app/_components/vendor/quote-form'
import { VendorForm } from '~/app/_components/vendor/vendor-form'
import { VendorStatusSelect } from '~/app/_components/vendor/vendor-status-select'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
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
        className={`cursor-pointer rounded-md border-2 border-dashed p-2 text-center text-xs transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <p className='text-muted-foreground'>
          {isDragActive ? 'Drop files here…' : 'Drag & drop or click to attach files'}
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <>
          <ul className='space-y-1'>
            {selectedFiles.map((file, i) => (
              <li
                key={`${file.name}-${i}`}
                className='flex items-center justify-between rounded bg-gray-50 px-2 py-1 text-xs'
              >
                <span className='truncate'>{file.name}</span>
                <button
                  type='button'
                  onClick={() => removeFile(i)}
                  className='ml-2 shrink-0 text-gray-400 hover:text-red-500'
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <Button size='sm' className='h-7 text-xs' onClick={handleUpload} disabled={busy}>
            {busy ? 'Uploading…' : `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`}
          </Button>
        </>
      )}
    </div>
  )
}

export function VendorDetailPanel({ vendor, onClose }: VendorDetailPanelProps) {
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
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
      <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-xl'>{vendorData.name}</DialogTitle>
        </DialogHeader>

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
              <span className='text-gray-500 text-sm'>Status:</span>
              <VendorStatusSelect
                value={vendorData.status}
                onChange={(status) => updateStatus.mutate({ vendorId: vendorData.id, status })}
                disabled={updateStatus.isPending}
              />
            </div>

            {/* Details */}
            <div className='grid grid-cols-2 gap-x-8 gap-y-2 text-sm'>
              {vendorData.location && (
                <>
                  <span className='text-gray-500'>Location</span>
                  <span>{vendorData.location}</span>
                </>
              )}
              {vendorData.website && (
                <>
                  <span className='text-gray-500'>Website</span>
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
                  <span className='text-gray-500'>Instagram</span>
                  <span>{vendorData.instagram}</span>
                </>
              )}
            </div>

            {/* Contact */}
            {(vendorData.contactName || vendorData.contactEmail || vendorData.contactPhone) && (
              <div>
                <p className='mb-2 font-semibold text-gray-400 text-xs uppercase tracking-wide'>
                  Contact
                </p>
                <div className='grid grid-cols-2 gap-x-8 gap-y-1 text-sm'>
                  {vendorData.contactName && (
                    <>
                      <span className='text-gray-500'>Name</span>
                      <span>{vendorData.contactName}</span>
                    </>
                  )}
                  {vendorData.contactEmail && (
                    <>
                      <span className='text-gray-500'>Email</span>
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
                      <span className='text-gray-500'>Phone</span>
                      <span>{vendorData.contactPhone}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Quotes */}
            <div>
              <div className='mb-2 flex items-center justify-between'>
                <p className='font-semibold text-gray-400 text-xs uppercase tracking-wide'>
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
                <p className='text-gray-400 text-sm'>No quotes yet.</p>
              )}

              {vendorData.quotes.length > 0 && (
                <div className='flex flex-col gap-2'>
                  {vendorData.quotes.map((quote: VendorQuote) => (
                    <div key={quote.id} className='rounded-lg border px-4 py-3'>
                      <div className='flex items-start justify-between'>
                        <div>
                          <p className='font-semibold text-gray-800'>{formatPrice(quote.price)}</p>
                          <p className='text-gray-500 text-xs'>{formatDate(quote.quoteDate)}</p>
                          {quote.notes && (
                            <p className='mt-1 text-gray-600 text-sm'>{quote.notes}</p>
                          )}
                        </div>
                        <button
                          type='button'
                          className='ml-4 text-red-400 text-xs hover:text-red-600'
                          onClick={() =>
                            deleteQuote.mutate({ quoteId: quote.id, vendorId: vendorData.id })
                          }
                          disabled={deleteQuote.isPending}
                        >
                          Remove
                        </button>
                      </div>

                      {/* Attached files */}
                      {quote.files.length > 0 && (
                        <div className='mt-2 space-y-1'>
                          {quote.files.map((file) => (
                            <div
                              key={file.id}
                              className='flex items-center gap-2 rounded bg-gray-50 px-2 py-1 text-xs'
                            >
                              <a
                                href={file.url}
                                target='_blank'
                                rel='noreferrer'
                                className='min-w-0 flex-1 truncate text-primary hover:underline'
                              >
                                {file.name}
                              </a>
                              <span className='shrink-0 text-gray-400'>
                                {formatFileSize(file.size)}
                              </span>
                              <button
                                type='button'
                                onClick={() =>
                                  deleteFile.mutate({
                                    fileId: file.id,
                                    quoteId: quote.id,
                                    vendorId: vendorData.id,
                                  })
                                }
                                disabled={deleteFile.isPending}
                                className='shrink-0 text-gray-400 hover:text-red-500'
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
                          className='mt-2 text-gray-400 text-xs hover:text-primary'
                          onClick={() => setAttachingQuoteId(quote.id)}
                        >
                          + Attach files
                        </button>
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
      </DialogContent>
    </Dialog>
  )
}
