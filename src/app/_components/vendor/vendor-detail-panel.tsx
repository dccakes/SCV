'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { QuoteForm } from '~/app/_components/vendor/quote-form'
import { VendorForm } from '~/app/_components/vendor/vendor-form'
import { StatusBadge, VendorStatusSelect } from '~/app/_components/vendor/vendor-status-select'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { type VendorWithQuotes } from '~/server/domains/vendor/vendor.types'
import { api } from '~/trpc/react'

type VendorDetailPanelProps = {
  vendor: VendorWithQuotes | null
  onClose: () => void
}

export function VendorDetailPanel({ vendor, onClose }: VendorDetailPanelProps) {
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
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

  if (!vendor || !vendorData) return null

  const formatPrice = (price: unknown) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(price))

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <Dialog open={!!vendor} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{vendorData.name}</DialogTitle>
        </DialogHeader>

        {showEditForm ? (
          <VendorForm
            vendor={vendorData}
            onSuccess={async () => {
              await refetch()
              await utils.vendor.getAll.invalidate()
              setShowEditForm(false)
            }}
            onCancel={() => setShowEditForm(false)}
          />
        ) : (
          <div className="flex flex-col gap-5">
            {/* Status */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Status:</span>
              <VendorStatusSelect
                value={vendorData.status}
                onChange={(status) =>
                  updateStatus.mutate({ vendorId: vendorData.id, status })
                }
                disabled={updateStatus.isPending}
              />
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {vendorData.location && (
                <>
                  <span className="text-gray-500">Location</span>
                  <span>{vendorData.location}</span>
                </>
              )}
              {vendorData.website && (
                <>
                  <span className="text-gray-500">Website</span>
                  <a
                    href={vendorData.website}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-pink-500 hover:underline"
                  >
                    {vendorData.website}
                  </a>
                </>
              )}
              {vendorData.instagram && (
                <>
                  <span className="text-gray-500">Instagram</span>
                  <span>{vendorData.instagram}</span>
                </>
              )}
            </div>

            {/* Contact */}
            {(vendorData.contactName || vendorData.contactEmail || vendorData.contactPhone) && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Contact
                </p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                  {vendorData.contactName && (
                    <>
                      <span className="text-gray-500">Name</span>
                      <span>{vendorData.contactName}</span>
                    </>
                  )}
                  {vendorData.contactEmail && (
                    <>
                      <span className="text-gray-500">Email</span>
                      <a
                        href={`mailto:${vendorData.contactEmail}`}
                        className="text-pink-500 hover:underline"
                      >
                        {vendorData.contactEmail}
                      </a>
                    </>
                  )}
                  {vendorData.contactPhone && (
                    <>
                      <span className="text-gray-500">Phone</span>
                      <span>{vendorData.contactPhone}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Quotes */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Quotes ({vendorData.quotes.length})
                </p>
                {!showQuoteForm && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
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
                <p className="text-sm text-gray-400">No quotes yet.</p>
              )}

              {vendorData.quotes.length > 0 && (
                <div className="flex flex-col gap-2">
                  {vendorData.quotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="flex items-start justify-between rounded-lg border px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">{formatPrice(quote.price)}</p>
                        <p className="text-xs text-gray-500">{formatDate(quote.quoteDate)}</p>
                        {quote.notes && (
                          <p className="mt-1 text-sm text-gray-600">{quote.notes}</p>
                        )}
                      </div>
                      <button
                        className="ml-4 text-xs text-red-400 hover:text-red-600"
                        onClick={() =>
                          deleteQuote.mutate({ quoteId: quote.id, vendorId: vendorData.id })
                        }
                        disabled={deleteQuote.isPending}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between border-t pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditForm(true)}
              >
                Edit Details
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
