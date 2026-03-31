'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import { LoadingSpinner } from '~/components/loaders'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { cn } from '~/lib/utils'
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
  }
}

export default function WeddingSettingsForm({ initialData }: WeddingSettingsFormProps) {
  const router = useRouter()

  const updateDetails = api.wedding.updateDetails.useMutation({
    onSuccess: () => {
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
      weddingLocation: initialData.weddingLocation ?? '',
    },
  })

  const [weddingDate, setWeddingDate] = useState<Date | undefined>(
    initialData.weddingDate ? new Date(initialData.weddingDate) : undefined
  )

  const { register, handleSubmit, formState } = form
  const { errors, isSubmitting } = formState

  return (
    <form
      onSubmit={handleSubmit((data) => {
        updateDetails.mutate({
          ...data,
          weddingDate: weddingDate?.toISOString(),
        })
      })}
      className='flex flex-col gap-6'
    >
      {updateDetails.isError && (
        <div className='rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive'>
          <p className='font-semibold'>Error updating wedding details</p>
          <p className='text-sm'>{updateDetails.error?.message ?? 'Please try again'}</p>
        </div>
      )}

      {updateDetails.isSuccess && (
        <div className='rounded-lg border border-success bg-success/10 p-4 text-success'>
          <p className='text-sm'>Wedding details updated successfully.</p>
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

      {/* Wedding Date & Location */}
      <div className='rounded-lg border border-border/90 bg-card/85 p-5'>
        <h3 className='mb-4 font-mono text-[0.62rem] text-foreground/55 uppercase tracking-widest'>
          Wedding Details
        </h3>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label>Tentative Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !weddingDate && 'text-muted-foreground'
                  )}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {weddingDate ? (
                    weddingDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='single'
                  selected={weddingDate}
                  onSelect={setWeddingDate}
                  captionLayout='dropdown'
                  startMonth={new Date()}
                  endMonth={new Date(new Date().getFullYear() + 10, 11)}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='weddingLocation'>Location</Label>
            <Input
              id='weddingLocation'
              placeholder='e.g., Beach Resort, Cabo'
              {...register('weddingLocation')}
              disabled={isSubmitting}
            />
          </div>
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
