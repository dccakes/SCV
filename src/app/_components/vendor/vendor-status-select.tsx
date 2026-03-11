'use client'

import { VendorStatus } from '@prisma/client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

const STATUS_LABELS: Record<VendorStatus, string> = {
  NOT_AVAILABLE: 'Not Available',
  DECLINED: 'Declined',
  IN_REVIEW: 'In Review',
  PRE_SELECTED: 'Pre-Selected',
  IN_NEGOTIATION: 'In Negotiation',
  SELECTED: 'Selected',
}

const STATUS_COLORS: Record<VendorStatus, string> = {
  NOT_AVAILABLE: 'bg-muted text-muted-foreground',
  DECLINED: 'bg-destructive/15 text-destructive',
  IN_REVIEW: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300',
  PRE_SELECTED: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  IN_NEGOTIATION: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  SELECTED: 'bg-success/15 text-success',
}

export function StatusBadge({ status }: { status: VendorStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 font-medium text-xs ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

type VendorStatusSelectProps = {
  value: VendorStatus
  onChange: (status: VendorStatus) => void
  disabled?: boolean
}

export function VendorStatusSelect({ value, onChange, disabled }: VendorStatusSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as VendorStatus)} disabled={disabled}>
      <SelectTrigger className='h-8 w-44 text-xs'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.values(VendorStatus).map((status) => (
          <SelectItem key={status} value={status} className='text-xs'>
            {STATUS_LABELS[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
