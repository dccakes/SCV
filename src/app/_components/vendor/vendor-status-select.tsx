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
  DECLINED: 'bg-destructive/10 text-destructive',
  IN_REVIEW: 'bg-accent/12 text-foreground/70',
  PRE_SELECTED: 'bg-primary/10 text-primary',
  IN_NEGOTIATION: 'bg-accent/20 text-foreground/80',
  SELECTED: 'bg-success/12 text-success',
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
