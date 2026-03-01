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
  NOT_AVAILABLE: 'bg-gray-100 text-gray-600',
  DECLINED: 'bg-red-100 text-red-700',
  IN_REVIEW: 'bg-yellow-100 text-yellow-700',
  PRE_SELECTED: 'bg-blue-100 text-blue-700',
  IN_NEGOTIATION: 'bg-orange-100 text-orange-700',
  SELECTED: 'bg-green-100 text-green-700',
}

export function StatusBadge({ status }: { status: VendorStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}
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
    <Select
      value={value}
      onValueChange={(v) => onChange(v as VendorStatus)}
      disabled={disabled}
    >
      <SelectTrigger className="h-8 w-44 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.values(VendorStatus).map((status) => (
          <SelectItem key={status} value={status} className="text-xs">
            {STATUS_LABELS[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
