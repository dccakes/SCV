'use client'

import { toast } from 'sonner'

import { StatusBadge, VendorStatusSelect } from '~/app/_components/vendor/vendor-status-select'
import { type Vendor } from '~/server/domains/vendor/vendor.types'
import { api } from '~/trpc/react'

type VendorCardProps = {
  vendor: Vendor
  latestQuotePrice?: number | null
  onViewDetails: (vendorId: string) => void
  onDeleted: () => void
}

export function VendorCard({ vendor, latestQuotePrice, onViewDetails, onDeleted }: VendorCardProps) {
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
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price)

  return (
    <div className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-1">
        <button
          className="text-left text-sm font-semibold text-gray-800 hover:text-pink-500"
          onClick={() => onViewDetails(vendor.id)}
        >
          {vendor.name}
        </button>
        {vendor.location && (
          <span className="text-xs text-gray-400">{vendor.location}</span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {latestQuotePrice != null && (
          <span className="text-sm font-medium text-gray-700">
            {formatPrice(latestQuotePrice)}
          </span>
        )}
        <VendorStatusSelect
          value={vendor.status}
          onChange={(status) => updateStatus.mutate({ vendorId: vendor.id, status })}
          disabled={updateStatus.isPending}
        />
        <button
          className="text-xs text-gray-400 hover:text-red-500"
          onClick={handleDelete}
          disabled={deleteVendor.isPending}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
