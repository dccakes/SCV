'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import type { z } from 'zod'

import { LoadingSpinner } from '~/components/loaders'
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
import type { NameDisplayOrder } from '~/server/domains/wedding/wedding.types'
import { updateWeddingDetailsSchema } from '~/server/domains/wedding/wedding.validator'
import { api } from '~/trpc/react'

type WeddingSettingsFormData = z.infer<typeof updateWeddingDetailsSchema>

type WeddingSettingsFormProps = {
  initialData: {
    groomFirstName: string
    groomLastName: string
    brideFirstName: string
    brideLastName: string
    nameDisplayOrder: NameDisplayOrder
    weddingDate?: string
    weddingLocation?: string
    primaryEventId?: string
  }
}

export default function WeddingSettingsForm({ initialData }: WeddingSettingsFormProps) {
  const router = useRouter()
  const utils = api.useUtils()

  const updateDetails = api.wedding.updateDetails.useMutation({
    onSuccess: () => {
      void utils.dashboard.getForActiveWorkspace.invalidate()
      void utils.wedding.getDetails.invalidate()
      router.refresh()
    },
  })

  const form = useForm<WeddingSettingsFormData>({
    resolver: zodResolver(updateWeddingDetailsSchema),
    defaultValues: {
      groomFirstName: initialData.groomFirstName,
      groomLastName: initialData.groomLastName,
      brideFirstName: initialData.brideFirstName,
      brideLastName: initialData.brideLastName,
      nameDisplayOrder: initialData.nameDisplayOrder,
    },
  })

  const { register, handleSubmit, control, watch, formState } = form
  const { errors, isSubmitting } = formState

  const groomFirstNameValue = watch('groomFirstName') || 'Groom'
  const brideFirstNameValue = watch('brideFirstName') || 'Bride'

  const parsedCeremonyDate = initialData.weddingDate ? new Date(initialData.weddingDate) : null
  const ceremonyDateLabel =
    parsedCeremonyDate && !Number.isNaN(parsedCeremonyDate.valueOf())
      ? parsedCeremonyDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'No date set'

  const ceremonyHref = initialData.primaryEventId
    ? `/events?eventId=${initialData.primaryEventId}`
    : '/events'

  return (
    <form
      onSubmit={handleSubmit((data: WeddingSettingsFormData) => {
        updateDetails.mutate(data)
      })}
      className='flex flex-col gap-6'
    >
      {updateDetails.isError && (
        <div className='rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive'>
          <p className='font-semibold'>Error updating names</p>
          <p className='text-sm'>{updateDetails.error?.message ?? 'Please try again'}</p>
        </div>
      )}

      {updateDetails.isSuccess && (
        <div className='rounded-lg border border-success bg-success/10 p-4 text-success'>
          <p className='text-sm'>Names updated successfully.</p>
        </div>
      )}

      {/* Couple Names */}
      <div className='grid gap-6 md:grid-cols-2'>
        {/* Groom */}
        <div className='space-y-4 rounded-lg border border-border/90 bg-card/85 p-5'>
          <h3 className='font-mono text-[0.62rem] text-foreground/55 uppercase tracking-widest'>
            Groom
          </h3>
          <div className='space-y-2'>
            <Label htmlFor='groomFirstName'>First Name</Label>
            <Input
              id='groomFirstName'
              placeholder='Enter first name'
              {...register('groomFirstName')}
              disabled={isSubmitting}
            />
            {errors.groomFirstName && (
              <p className='text-destructive text-sm'>{errors.groomFirstName.message}</p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='groomLastName'>Last Name</Label>
            <Input
              id='groomLastName'
              placeholder='Enter last name'
              {...register('groomLastName')}
              disabled={isSubmitting}
            />
            {errors.groomLastName && (
              <p className='text-destructive text-sm'>{errors.groomLastName.message}</p>
            )}
          </div>
        </div>

        {/* Bride */}
        <div className='space-y-4 rounded-lg border border-border/90 bg-card/85 p-5'>
          <h3 className='font-mono text-[0.62rem] text-foreground/55 uppercase tracking-widest'>
            Bride
          </h3>
          <div className='space-y-2'>
            <Label htmlFor='brideFirstName'>First Name</Label>
            <Input
              id='brideFirstName'
              placeholder='Enter first name'
              {...register('brideFirstName')}
              disabled={isSubmitting}
            />
            {errors.brideFirstName && (
              <p className='text-destructive text-sm'>{errors.brideFirstName.message}</p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='brideLastName'>Last Name</Label>
            <Input
              id='brideLastName'
              placeholder='Enter last name'
              {...register('brideLastName')}
              disabled={isSubmitting}
            />
            {errors.brideLastName && (
              <p className='text-destructive text-sm'>{errors.brideLastName.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Name Display Order */}
      <div className='space-y-2 rounded-lg border border-border/90 bg-card/85 p-5'>
        <h3 className='font-mono text-[0.62rem] text-foreground/55 uppercase tracking-widest'>
          Name Order
        </h3>
        <Label htmlFor='nameDisplayOrder'>Whose name appears first on your website</Label>
        <Controller
          name='nameDisplayOrder'
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
              <SelectTrigger id='nameDisplayOrder'>
                <SelectValue placeholder='Select name order' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='GROOM_FIRST'>
                  {groomFirstNameValue} &amp; {brideFirstNameValue}
                </SelectItem>
                <SelectItem value='BRIDE_FIRST'>
                  {brideFirstNameValue} &amp; {groomFirstNameValue}
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        <p className='text-foreground/65 text-sm'>
          This order is used across your wedding website, save the date, invitation, and RSVP pages.
        </p>
      </div>

      {/* Ceremony Event Summary */}
      <div className='rounded-lg border border-border/90 bg-card/85 p-5'>
        <h3 className='mb-4 font-mono text-[0.62rem] text-foreground/55 uppercase tracking-widest'>
          Ceremony Event
        </h3>
        <div className='space-y-4'>
          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='rounded-md border border-border/70 bg-muted/20 p-3'>
              <p className='mb-1 font-mono text-[0.62rem] text-foreground/55 uppercase tracking-widest'>
                Date
              </p>
              <p className='flex items-center gap-2 text-sm'>
                <CalendarIcon className='h-4 w-4 text-foreground/60' />
                {ceremonyDateLabel}
              </p>
            </div>
            <div className='rounded-md border border-border/70 bg-muted/20 p-3'>
              <p className='mb-1 font-mono text-[0.62rem] text-foreground/55 uppercase tracking-widest'>
                Location
              </p>
              <p className='flex items-center gap-2 text-sm'>
                <MapPin className='h-4 w-4 text-foreground/60' />
                {initialData.weddingLocation ?? 'No location set'}
              </p>
            </div>
          </div>
          <p className='text-foreground/65 text-sm'>
            Ceremony details are managed from the Events page.
          </p>
          <Button asChild variant='outline' className='w-full sm:w-auto'>
            <Link href={ceremonyHref}>Edit Ceremony in Events</Link>
          </Button>
        </div>
      </div>

      <Button type='submit' disabled={isSubmitting || updateDetails.isPending} className='w-full'>
        {updateDetails.isPending ? (
          <span className='flex items-center gap-2'>
            <LoadingSpinner size={16} /> Saving...
          </span>
        ) : (
          'Save Changes'
        )}
      </Button>
    </form>
  )
}
