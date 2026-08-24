'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from 'zod'

import { LoadingSpinner } from '~/components/loaders'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { updateWeddingDetailsSchema } from '~/server/domains/wedding/wedding.validator'
import { api } from '~/trpc/react'

type WeddingSettingsFormData = z.infer<typeof updateWeddingDetailsSchema>

type WeddingSettingsFormProps = {
  initialData: {
    groomFirstName: string
    groomLastName: string
    brideFirstName: string
    brideLastName: string
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
      toast.success('Names updated successfully.')
      void utils.dashboard.getForActiveWorkspace.invalidate()
      void utils.wedding.getDetails.invalidate()
      router.refresh()
    },
    onError: () => {
      toast.error('Failed to update names. Please try again.')
    },
  })

  const form = useForm<WeddingSettingsFormData>({
    resolver: zodResolver(updateWeddingDetailsSchema),
    defaultValues: {
      groomFirstName: initialData.groomFirstName,
      groomLastName: initialData.groomLastName,
      brideFirstName: initialData.brideFirstName,
      brideLastName: initialData.brideLastName,
    },
  })

  const { register, handleSubmit, formState } = form
  const { errors, isSubmitting } = formState

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
