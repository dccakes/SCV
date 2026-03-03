'use client'

import { VendorCategory } from '@prisma/client'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
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

type VendorFormProps = {
  defaultCategory?: VendorCategory
  vendor?: Vendor
  onSuccess: () => void
  onCancel: () => void
}

export function VendorForm({ defaultCategory, vendor, onSuccess, onCancel }: VendorFormProps) {
  const isEditing = !!vendor
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
      updateVendor.mutate({ vendorId: vendor.id, ...common })
    } else {
      createVendor.mutate({ category, ...common })
    }
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
      {!isEditing && (
        <div>
          <Label className='font-medium text-sm'>Category</Label>
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

      <div>
        <Label htmlFor='name' className='font-medium text-sm'>
          Name <span className='text-red-500'>*</span>
        </Label>
        <Input
          id='name'
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='Vendor or business name'
          required
          className='mt-1'
        />
      </div>

      <div>
        <Label htmlFor='location' className='font-medium text-sm'>
          Location
        </Label>
        <Input
          id='location'
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder='City, State'
          className='mt-1'
        />
      </div>

      <div className='grid grid-cols-2 gap-3'>
        <div>
          <Label htmlFor='website' className='font-medium text-sm'>
            Website
          </Label>
          <Input
            id='website'
            type='url'
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder='https://…'
            className='mt-1'
          />
        </div>
        <div>
          <Label htmlFor='instagram' className='font-medium text-sm'>
            Instagram
          </Label>
          <Input
            id='instagram'
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder='@handle'
            className='mt-1'
          />
        </div>
      </div>

      <div className='border-t pt-3'>
        <p className='mb-2 font-semibold text-gray-500 text-xs uppercase tracking-wide'>
          Main Contact
        </p>
        <div className='flex flex-col gap-3'>
          <div>
            <Label htmlFor='contactName' className='text-sm'>
              Name
            </Label>
            <Input
              id='contactName'
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder='Contact name'
              className='mt-1'
            />
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <Label htmlFor='contactEmail' className='text-sm'>
                Email
              </Label>
              <Input
                id='contactEmail'
                type='email'
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder='email@example.com'
                className='mt-1'
              />
            </div>
            <div>
              <Label htmlFor='contactPhone' className='text-sm'>
                Phone
              </Label>
              <Input
                id='contactPhone'
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder='+1 (555) 000-0000'
                className='mt-1'
              />
            </div>
          </div>
        </div>
      </div>

      <div className='flex gap-2 self-end pt-2'>
        <Button type='button' variant='outline' onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button
          type='submit'
          disabled={isPending}
          className='bg-primary text-primary-foreground hover:bg-primary/90'
        >
          {isPending ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Vendor'}
        </Button>
      </div>
    </form>
  )
}
