'use client'

import { X } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { toast } from 'sonner'
import { formatCurrency } from '~/components/budget/format'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { StatusBadge } from '~/components/vendor/vendor-status-select'
import type { VendorWithQuotes } from '~/server/domains/vendor/vendor.types'
import { api } from '~/trpc/react'

type VendorCardProps = {
  vendor: VendorWithQuotes
  quotePrices: number[]
  currency: string
  onViewDetails: (vendorId: string) => void
  onDeleted: () => void
}

export function VendorCard({
  vendor,
  quotePrices,
  currency,
  onViewDetails,
  onDeleted,
}: Readonly<VendorCardProps>) {
  const utils = api.useUtils()
  const [showRatingsBreakdown, setShowRatingsBreakdown] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const isMuted = vendor.status === 'DECLINED' || vendor.status === 'NOT_AVAILABLE'
  const isContacted = 'contacted' in vendor && vendor.contacted === true
  const coverImage = vendor.images.find((img) => img.isPrimary)

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
    setShowDeleteDialog(true)
  }

  const formatPrice = (price: number) => formatCurrency(price, currency)

  const quoteCount = quotePrices.length
  const averageRating = vendor.ratingSummary.average
  const ratingsPanelId = `vendor-ratings-${vendor.id}`

  const priceLabel = (() => {
    if (quoteCount === 0) return null
    if (quoteCount === 1) return formatPrice(quotePrices[0] ?? 0)
    const min = Math.min(...quotePrices)
    const max = Math.max(...quotePrices)
    if (min === max) return formatPrice(min)
    return `${formatPrice(min)} – ${formatPrice(max)}`
  })()

  return (
    <div
      data-testid='vendor-card-root'
      className={`group relative flex cursor-pointer flex-col gap-2 rounded-lg border border-border/90 bg-card/60 px-4 py-3 transition-all hover:bg-card hover:shadow-sm sm:flex-row sm:items-center sm:justify-between ${
        isMuted ? 'opacity-60 grayscale' : ''
      }`}
    >
      <button
        type='button'
        className='absolute inset-0 rounded-lg'
        onClick={() => onViewDetails(vendor.id)}
        aria-label={`View ${vendor.name} details`}
      />
      <div className='pointer-events-none flex items-center gap-3'>
        {coverImage && (
          <Image
            src={coverImage.url}
            alt={vendor.name}
            width={48}
            height={48}
            className='h-12 w-12 shrink-0 rounded-md object-cover'
          />
        )}
        <div className='flex flex-col gap-0.5'>
          <span className='font-display text-[1.05rem] text-foreground italic group-hover:text-primary'>
            {vendor.name}
          </span>
          <div className='flex items-center gap-2'>
            {vendor.location && (
              <span className='font-mono text-[10px] text-muted-foreground lowercase tracking-wider'>
                {vendor.location}
              </span>
            )}
            {isContacted && (
              <>
                {vendor.location && <span className='text-border'>·</span>}
                <span className='rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary uppercase tracking-wider'>
                  Contacted
                </span>
              </>
            )}
            {quoteCount > 0 && (
              <>
                {(vendor.location || isContacted) && <span className='text-border'>·</span>}
                <span className='font-mono text-[10px] text-muted-foreground lowercase tracking-wider'>
                  {quoteCount} {quoteCount === 1 ? 'quote' : 'quotes'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className='pointer-events-none relative z-10 flex flex-wrap items-center gap-3'>
        <StatusBadge status={vendor.status} />
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
        {averageRating !== null && (
          <span className='font-mono text-[0.55rem] text-muted-foreground lowercase tracking-wider'>
            {averageRating.toFixed(1)} avg
          </span>
        )}
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
        {priceLabel && (
          <span className='font-medium font-mono text-foreground/80 text-xs'>{priceLabel}</span>
        )}
        <button
          type='button'
          className='pointer-events-auto text-muted-foreground/50 transition-opacity hover:text-destructive'
          onClick={handleDelete}
          disabled={deleteVendor.isPending}
          aria-label={`Remove ${vendor.name}`}
        >
          <X className='h-3.5 w-3.5' aria-hidden='true' />
        </button>
      </div>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {vendor.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this vendor and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteVendor.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                deleteVendor.mutate({ vendorId: vendor.id })
              }}
              disabled={deleteVendor.isPending}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleteVendor.isPending ? 'Removing…' : 'Remove vendor'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
