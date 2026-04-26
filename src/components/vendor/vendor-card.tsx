'use client'

import { toast } from 'sonner'

import { StatusBadge } from '~/components/vendor/vendor-status-select'
import type { Vendor } from '~/server/domains/vendor/vendor.types'
import { api } from '~/trpc/react'

type VendorCardProps = {
  vendor: Vendor
  quotePrices: number[]
  onViewDetails: (vendorId: string) => void
  onDeleted: () => void
}

export function VendorCard({ vendor, quotePrices, onViewDetails, onDeleted }: VendorCardProps) {
  const utils = api.useUtils()
  const isMuted = vendor.status === 'DECLINED' || vendor.status === 'NOT_AVAILABLE'
  const isContacted = 'contacted' in vendor && vendor.contacted === true

  const deleteVendor = api.vendor.delete.useMutation({
    onSuccess: async () => {
      await utils.vendor.getAll.invalidate()
      toast.success(`${vendor.name} removed`)
      onDeleted()
    },
    onError: () => toast.error('Failed to delete vendor'),
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

  const priceDisplay = () => {
    if (quoteCount === 0) return null
    if (quoteCount === 1) return formatPrice(quotePrices[0] ?? 0)
    const min = Math.min(...quotePrices)
    const max = Math.max(...quotePrices)
    if (min === max) return formatPrice(min)
    return `${formatPrice(min)} – ${formatPrice(max)}`
  }

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
          {isContacted && (
            <>
              {vendor.location && <span className='text-border'>·</span>}
              <span className='rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[0.52rem] text-primary uppercase tracking-wider'>
                Contacted
              </span>
            </>
          )}
          {quoteCount > 0 && (
            <>
              {(vendor.location || isContacted) && <span className='text-border'>·</span>}
              <span className='font-mono text-[0.55rem] text-muted-foreground lowercase tracking-wider'>
                {quoteCount} {quoteCount === 1 ? 'quote' : 'quotes'}
              </span>
            </>
          )}
        </div>
      </div>

      <div className='relative z-10 flex items-center gap-3'>
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
