'use client'

import { Button } from '~/components/ui/button'
import { getQuoteSummary } from '~/components/vendor/vendor-list-view-model'
import { StatusBadge } from '~/components/vendor/vendor-status-select'
import type { VendorWithQuotes } from '~/server/domains/vendor/vendor.types'

type VendorCompareCardProps = Readonly<{
  vendor: VendorWithQuotes
  currency: string
  onViewDetails: (vendorId: string) => void
}>

export function VendorCompareCard({ vendor, currency, onViewDetails }: VendorCompareCardProps) {
  const quote = getQuoteSummary(vendor, currency)
  const isSelected = vendor.status === 'SELECTED'
  const isMuted = vendor.status === 'DECLINED' || vendor.status === 'NOT_AVAILABLE'
  const average = vendor.ratingSummary.average

  return (
    <article
      className={`flex min-w-0 flex-[1_1_260px] flex-col gap-4 rounded-2xl border-2 bg-card p-5 shadow-sm ${
        isSelected ? 'border-primary' : 'border-transparent'
      } ${isMuted ? 'opacity-60' : ''}`}
    >
      <div className='flex items-center justify-between gap-2'>
        <StatusBadge status={vendor.status} />
        {average !== null && (
          <span className='text-muted-foreground text-xs'>{average.toFixed(1)} ★ average</span>
        )}
      </div>

      <div className='flex flex-col gap-0.5'>
        <h3 className='font-semibold text-foreground text-lg leading-snug'>{vendor.name}</h3>
        {vendor.location && <p className='text-muted-foreground text-sm'>{vendor.location}</p>}
      </div>

      <div className='flex flex-col gap-1'>
        {quote ? (
          <>
            <p className='font-display text-4xl text-foreground leading-none'>{quote.price}</p>
            <p className='text-muted-foreground text-sm'>{quote.basis}</p>
          </>
        ) : (
          <p className='text-muted-foreground text-sm'>No quote yet</p>
        )}
      </div>

      {vendor.notes && (
        <p className='line-clamp-3 text-secondary-foreground text-sm leading-relaxed'>
          {vendor.notes}
        </p>
      )}

      <Button
        type='button'
        variant={isSelected ? 'default' : 'outline'}
        className='mt-auto'
        onClick={() => onViewDetails(vendor.id)}
      >
        View details
      </Button>
    </article>
  )
}
