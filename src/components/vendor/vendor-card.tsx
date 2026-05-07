'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { StatusBadge } from '~/components/vendor/vendor-status-select'
import type { VendorWithQuotes } from '~/server/domains/vendor/vendor.types'
import { api } from '~/trpc/react'

type VendorCardProps = {
  vendor: VendorWithQuotes
  quotePrices: number[]
  onViewDetails: (vendorId: string) => void
  onDeleted: () => void
}

export function VendorCard({ vendor, quotePrices, onViewDetails, onDeleted }: VendorCardProps) {
  const utils = api.useUtils()
  const [showRatingsBreakdown, setShowRatingsBreakdown] = useState(false)

  const deleteVendor = api.vendor.delete.useMutation({
    onSuccess: async () => {
      await utils.vendor.getAll.invalidate()
      toast.success(`${vendor.name} removed`)
      onDeleted()
    },
    onError: () => toast.error('Failed to delete vendor'),
  })
  const setRating = api.vendor.setRating.useMutation({
    onSuccess: async () => {
      await utils.vendor.getAll.invalidate()
      toast.success('Rating updated')
    },
    onError: () => toast.error('Failed to save rating'),
  })

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm(`Remove ${vendor.name}?`)) {
      deleteVendor.mutate({ vendorId: vendor.id })
    }
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price)

  const quoteCount = quotePrices.length
  const averageRating = vendor.ratingSummary.average
  const ratingsPanelId = `vendor-ratings-${vendor.id}`

  const priceDisplay = () => {
    if (quoteCount === 0) return null
    if (quoteCount === 1) return formatPrice(quotePrices[0] ?? 0)
    const min = Math.min(...quotePrices)
    const max = Math.max(...quotePrices)
    if (min === max) return formatPrice(min)
    return `${formatPrice(min)} – ${formatPrice(max)}`
  }

  return (
    <div className='group relative flex cursor-pointer flex-col gap-2 rounded-lg border border-border/90 bg-card/60 px-4 py-3 transition-all hover:bg-card hover:shadow-sm sm:flex-row sm:items-center sm:justify-between'>
      <button
        type='button'
        className='absolute inset-0 rounded-lg'
        onClick={() => onViewDetails(vendor.id)}
        aria-label={`View ${vendor.name} details`}
      />
      <div className='pointer-events-none flex flex-col gap-0.5'>
        <span className='font-display text-[1.05rem] text-foreground italic group-hover:text-primary'>
          {vendor.name}
        </span>
        <div className='flex items-center gap-2'>
          {vendor.location && (
            <span className='font-mono text-[0.55rem] text-muted-foreground lowercase tracking-wider'>
              {vendor.location}
            </span>
          )}
          {quoteCount > 0 && (
            <>
              {vendor.location && <span className='text-border'>·</span>}
              <span className='font-mono text-[0.55rem] text-muted-foreground lowercase tracking-wider'>
                {quoteCount} {quoteCount === 1 ? 'quote' : 'quotes'}
              </span>
            </>
          )}
        </div>
        {averageRating !== null && (
          <span className='font-mono text-[0.55rem] text-muted-foreground lowercase tracking-wider'>
            {averageRating.toFixed(1)} avg
          </span>
        )}
      </div>

      <div className='relative z-10 flex items-center gap-3'>
        <div className='pointer-events-auto flex items-center gap-1'>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type='button'
              className='text-sm leading-none'
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              onClick={(event) => {
                event.stopPropagation()
                setRating.mutate({ vendorId: vendor.id, stars: star })
              }}
              disabled={setRating.isPending}
            >
              {star <= (vendor.ratingSummary.currentUserRating ?? 0) ? '★' : '☆'}
            </button>
          ))}
        </div>
        {vendor.ratingSummary.ratings.length > 0 && (
          <div className='pointer-events-auto relative'>
            <button
              type='button'
              className='font-mono text-[0.55rem] text-muted-foreground lowercase tracking-wider'
              onClick={(event) => {
                event.stopPropagation()
                setShowRatingsBreakdown((value) => !value)
              }}
              aria-label='Toggle ratings breakdown'
              aria-expanded={showRatingsBreakdown}
              aria-controls={ratingsPanelId}
            >
              ratings
            </button>
            <div
              id={ratingsPanelId}
              className={`absolute right-0 z-20 mt-1 w-44 rounded border border-border bg-popover p-2 shadow-sm ${
                showRatingsBreakdown ? 'block' : 'hidden'
              }`}
            >
              {vendor.ratingSummary.ratings.map((rating) => (
                <p
                  key={rating.userId}
                  className='font-mono text-[0.55rem] text-popover-foreground lowercase tracking-wider'
                >
                  {rating.userLabel}: {rating.stars} stars
                </p>
              ))}
            </div>
          </div>
        )}
        {priceDisplay() && (
          <span className='font-medium font-mono text-[0.72rem] text-foreground/80'>
            {priceDisplay()}
          </span>
        )}
        <StatusBadge status={vendor.status} />
        <button
          type='button'
          className='text-muted-foreground/50 transition-opacity hover:text-destructive'
          onClick={handleDelete}
          disabled={deleteVendor.isPending}
          aria-label={`Remove ${vendor.name}`}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
