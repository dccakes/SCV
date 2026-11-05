'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { PhoneInput } from '~/components/ui/phone-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { normalizePhoneToE164 } from '~/lib/phone/phone-validator'
import type { Vendor } from '~/server/domains/vendor/vendor.types'
import { api } from '~/trpc/react'

type VendorCategory = Vendor['category']

const VENDOR_CATEGORIES = [
  'VENUE',
  'CATERING',
  'PHOTOGRAPHER',
  'VIDEOGRAPHER',
  'MUSIC',
  'FLOWERS',
  'ACCOMMODATION',
  'OTHER',
] satisfies VendorCategory[]

const CATEGORY_LABELS: Record<VendorCategory, string> = {
  VENUE: 'Venue',
  CATERING: 'Catering',
  PHOTOGRAPHER: 'Photographer',
  VIDEOGRAPHER: 'Videographer',
  MUSIC: 'Music',
  FLOWERS: 'Flowers',
  ACCOMMODATION: 'Accommodation',
  OTHER: 'Other',
}

type VendorFormBaseProps = {
  onSuccess: () => void
  onCancel: () => void
}

type VendorFormProps =
  | (VendorFormBaseProps & {
      mode: 'create'
      defaultCategory?: VendorCategory
      vendor?: never
    })
  | (VendorFormBaseProps & {
      mode: 'edit'
      vendor: Vendor
      defaultCategory?: never
    })

export function VendorForm(props: Readonly<VendorFormProps>) {
  const { mode, onSuccess, onCancel } = props
  const isEditing = mode === 'edit'
  const vendor = mode === 'edit' ? props.vendor : undefined
  const defaultCategory = mode === 'create' ? props.defaultCategory : undefined
  const utils = api.useUtils()

  const [category, setCategory] = useState<VendorCategory>(
    vendor?.category ?? defaultCategory ?? 'OTHER'
  )
  const [name, setName] = useState(vendor?.name ?? '')
  const [location, setLocation] = useState(vendor?.location ?? '')
  const [website, setWebsite] = useState(vendor?.website ?? '')
  const [instagram, setInstagram] = useState(vendor?.instagram ?? '')
  const [contactName, setContactName] = useState(vendor?.contactName ?? '')
  const [contactEmail, setContactEmail] = useState(vendor?.contactEmail ?? '')
  const [contactPhone, setContactPhone] = useState(normalizePhoneToE164(vendor?.contactPhone) ?? '')

  const invalidateVendors = () => utils.vendor.getAll.invalidate()

  const createVendor = api.vendor.create.useMutation({
    onSuccess: async () => {
      await invalidateVendors()
      toast.success('Vendor added')
      onSuccess()
    },
    onError: (err) => {
      const fieldErrors = err.data?.zodError?.fieldErrors
      if (fieldErrors) {
        const firstField = Object.keys(fieldErrors)[0]
        const firstMsg = firstField ? (fieldErrors[firstField]?.[0] ?? 'Invalid value') : null
        const label = firstField ? ` (${firstField}: ${firstMsg})` : ''
        toast.error(`Failed to add vendor${label}`)
      } else {
        toast.error('Failed to add vendor')
      }
    },
  })

  const updateVendor = api.vendor.update.useMutation({
    onSuccess: async () => {
      await invalidateVendors()
      toast.success('Vendor updated')
      onSuccess()
    },
    onError: () => toast.error('Failed to update vendor'),
  })

  const isPending = createVendor.isPending || updateVendor.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const normalizeWebsite = (url: string): string | undefined => {
      if (!url) return undefined
      if (/^https?:\/\//i.test(url)) return url
      return `https://${url}`
    }
    const common = {
      name,
      location: location || undefined,
      website: normalizeWebsite(website),
      instagram: instagram || undefined,
      contactName: contactName || undefined,
      contactEmail: contactEmail || undefined,
      contactPhone: normalizePhoneToE164(contactPhone),
    }
    if (isEditing) {
      updateVendor.mutate({ vendorId: props.vendor.id, ...common })
    } else {
      createVendor.mutate({ category, ...common })
    }
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
      {!isEditing && (
        // biome-ignore lint/a11y/noLabelWithoutControl: Select renders a custom trigger, not a native select
        <label className='space-y-1'>
          <span className='font-mono text-[0.55rem] text-muted-foreground uppercase tracking-widest'>
            Category
          </span>
          <Select value={category} onValueChange={(v) => setCategory(v as VendorCategory)}>
            <SelectTrigger className='mt-1'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VENDOR_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      )}

      <label className='space-y-1' htmlFor='vendor-name'>
        <span className='font-mono text-[0.55rem] text-muted-foreground uppercase tracking-widest'>
          Name <span className='text-primary'>*</span>
        </span>
        <Input
          id='vendor-name'
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='Vendor or business name'
          required
        />
      </label>

      <label className='space-y-1' htmlFor='vendor-location'>
        <span className='font-mono text-[0.55rem] text-muted-foreground uppercase tracking-widest'>
          Location
        </span>
        <Input
          id='vendor-location'
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder='City, State'
        />
      </label>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <label className='space-y-1' htmlFor='vendor-website'>
          <span className='font-mono text-[0.55rem] text-muted-foreground uppercase tracking-widest'>
            Website
          </span>
          <Input
            id='vendor-website'
            type='text'
            inputMode='url'
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder='https://example.com'
          />
        </label>
        <label className='space-y-1' htmlFor='vendor-instagram'>
          <span className='font-mono text-[0.55rem] text-muted-foreground uppercase tracking-widest'>
            Instagram
          </span>
          <Input
            id='vendor-instagram'
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder='@handle'
          />
        </label>
      </div>

      {/* Contact section with hairline rule */}
      <div className='pt-1'>
        <div className='mb-3 flex items-center gap-3'>
          <span className='shrink-0 font-mono text-[0.58rem] text-muted-foreground uppercase tracking-widest'>
            Main Contact
          </span>
          <span className='h-px flex-1 bg-border' aria-hidden='true' />
        </div>
        <div className='flex flex-col gap-3'>
          <label className='space-y-1' htmlFor='vendor-contact-name'>
            <span className='font-mono text-[0.55rem] text-muted-foreground uppercase tracking-widest'>
              Name
            </span>
            <Input
              id='vendor-contact-name'
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder='Contact name'
            />
          </label>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <label className='space-y-1' htmlFor='vendor-contact-email'>
              <span className='font-mono text-[0.55rem] text-muted-foreground uppercase tracking-widest'>
                Email
              </span>
              <Input
                id='vendor-contact-email'
                type='email'
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder='email@example.com'
              />
            </label>
            <label className='space-y-1' htmlFor='vendor-contact-phone'>
              <span className='font-mono text-[0.55rem] text-muted-foreground uppercase tracking-widest'>
                Phone
              </span>
              <PhoneInput
                id='vendor-contact-phone'
                value={contactPhone || undefined}
                onChange={(nextValue) => setContactPhone(nextValue ?? '')}
                placeholder='+1 (555) 000-0000'
              />
            </label>
          </div>
        </div>
      </div>

      <div className='flex gap-2 self-end pt-2'>
        <Button type='button' variant='outline' onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type='submit' disabled={isPending}>
          {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Vendor'}
        </Button>
      </div>
    </form>
  )
}
