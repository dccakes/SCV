'use client'

import { toast } from 'sonner'

import { VendorStatusSelect } from '~/components/vendor/vendor-status-select'
import type { Vendor } from '~/server/domains/vendor/vendor.types'
import { api } from '~/trpc/react'

type VendorCardProps = {
  vendor: Vendor
  latestQuotePrice?: number | null
  onViewDetails: (vendorId: string) => void
  onDeleted: () => void
}

export function VendorCard({
  vendor,
  latestQuotePrice,
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

  return (
    <div className='flex items-center justify-between rounded-lg border bg-card px-4 py-3 shadow-sm'>
      <div className='flex flex-col gap-1'>
        <button
          type='button'
          className='text-left font-semibold text-foreground text-sm hover:text-primary'
          onClick={() => onViewDetails(vendor.id)}
        >
          {vendor.name}
        </button>
        {vendor.location && (
          <span className='text-muted-foreground text-xs'>{vendor.location}</span>
        )}
      </div>

      <div className='flex items-center gap-4'>
        {latestQuotePrice != null && (
          <span className='font-medium text-foreground text-sm'>
            {formatPrice(latestQuotePrice)}
          </span>
        )}
        <VendorStatusSelect
          value={vendor.status}
          onChange={(status) => updateStatus.mutate({ vendorId: vendor.id, status })}
          disabled={updateStatus.isPending}
        />
        <button
          type='button'
          className='text-muted-foreground text-xs hover:text-destructive'
          onClick={handleDelete}
          disabled={deleteVendor.isPending}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
