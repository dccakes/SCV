'use client'

import { toast } from 'sonner'

import { VendorStatusSelect } from '~/components/vendor/vendor-status-select'
import type { Vendor } from '~/server/domains/vendor/vendor.types'
import { api } from '~/trpc/react'

type VendorCardProps = {
  vendor: Vendor
  quotePrices: number[]
  onViewDetails: (vendorId: string) => void
  onDeleted: () => void
}

export function VendorCard({
  vendor,
  quotePrices,
  onViewDetails,
  onDeleted,
}: VendorCardProps) {
  const utils = api.useUtils()

  const updateStatus = api.vendor.updateStatus.useMutation({
    onSuccess: () => utils.vendor.getAll.invalidate(),
    onError: () => toast.error('Failed to update status'),
  })

  const deleteVendor = api.vendor.delete.useMutation({
    onSuccess: async () => {
      await utils.vendor.getAll.invalidate()
      toast.success(`${vendor.name} removed`)
      onDeleted()
    },
    onError: () => toast.error('Failed to delete vendor'),
  })

  const handleDelete = () => {
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
    if (quoteCount === 1) return formatPrice(quotePrices[0]!)
    const min = Math.min(...quotePrices)
    const max = Math.max(...quotePrices)
    if (min === max) return formatPrice(min)
    return `${formatPrice(min)} – ${formatPrice(max)}`
  }

  return (
    <div className='flex flex-col gap-2 rounded-lg border border-border/90 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex flex-col gap-1'>
        <button
          type='button'
          className='text-left font-semibold text-foreground text-sm hover:text-primary'
          onClick={() => onViewDetails(vendor.id)}
        >
          {vendor.name}
        </button>
        <div className='flex items-center gap-2'>
          {vendor.location && <span className='text-foreground/50 text-xs'>{vendor.location}</span>}
          {quoteCount > 0 && (
            <>
              {vendor.location && <span className='text-foreground/30 text-xs'>·</span>}
              <span className='text-foreground/50 text-xs'>
                {quoteCount} {quoteCount === 1 ? 'quote' : 'quotes'}
              </span>
            </>
          )}
        </div>
      </div>

      <div className='flex items-center gap-4'>
        {priceDisplay() && (
          <span className='font-medium text-foreground/80 text-sm'>{priceDisplay()}</span>
        )}
        <VendorStatusSelect
          value={vendor.status}
          onChange={(status) => updateStatus.mutate({ vendorId: vendor.id, status })}
          disabled={updateStatus.isPending}
        />
        <button
          type='button'
          className='text-foreground/40 text-xs hover:text-destructive'
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
