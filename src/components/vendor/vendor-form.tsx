'use client'

import { VendorCategory } from '@prisma/client'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import type { Vendor } from '~/server/domains/vendor/vendor.types'
import { api } from '~/trpc/react'

const CATEGORY_LABELS: Record<VendorCategory, string> = {
  VENUE: 'Venue',
  CATERING: 'Catering',
  PHOTOGRAPHER: 'Photographer',
  VIDEOGRAPHER: 'Videographer',
  MUSIC: 'Music',
  FLOWERS: 'Flowers',
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
    vendor?.category ?? defaultCategory ?? VendorCategory.OTHER
  )
  const [name, setName] = useState(vendor?.name ?? '')
  const [location, setLocation] = useState(vendor?.location ?? '')
  const [website, setWebsite] = useState(vendor?.website ?? '')
  const [instagram, setInstagram] = useState(vendor?.instagram ?? '')
  const [contactName, setContactName] = useState(vendor?.contactName ?? '')
  const [contactEmail, setContactEmail] = useState(vendor?.contactEmail ?? '')
  const [contactPhone, setContactPhone] = useState(vendor?.contactPhone ?? '')

  const invalidateVendors = () => utils.vendor.getAll.invalidate()

  const createVendor = api.vendor.create.useMutation({
    onSuccess: async () => {
      await invalidateVendors()
      toast.success('Vendor added')
      onSuccess()
    },
    onError: () => toast.error('Failed to add vendor'),
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
    const common = {
      name,
      location: location || undefined,
      website: website || undefined,
      instagram: instagram || undefined,
      contactName: contactName || undefined,
      contactEmail: contactEmail || undefined,
      contactPhone: contactPhone || undefined,
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
        <div className='space-y-1'>
          <span className='font-mono text-[0.55rem] text-muted-foreground uppercase tracking-widest'>
            Category
          </span>
          <Select value={category} onValueChange={(v) => setCategory(v as VendorCategory)}>
            <SelectTrigger className='mt-1'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(VendorCategory).map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <label htmlFor='vendor-name' className='space-y-1'>
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

      <label htmlFor='vendor-location' className='space-y-1'>
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
        <label htmlFor='vendor-website' className='space-y-1'>
          <span className='font-mono text-[0.55rem] text-muted-foreground uppercase tracking-widest'>
            Website
          </span>
          <Input
            id='vendor-website'
            type='url'
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder='https://...'
          />
        </label>
        <label htmlFor='vendor-instagram' className='space-y-1'>
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
          <label htmlFor='vendor-contact-name' className='space-y-1'>
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
            <label htmlFor='vendor-contact-email' className='space-y-1'>
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
            <label htmlFor='vendor-contact-phone' className='space-y-1'>
              <span className='font-mono text-[0.55rem] text-muted-foreground uppercase tracking-widest'>
                Phone
              </span>
              <Input
                id='vendor-contact-phone'
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
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
