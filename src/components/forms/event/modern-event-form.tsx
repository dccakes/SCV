'use client'

/**
 * Modern Event Form
 *
 * Create/update event form using react-hook-form + Zod + shadcn.
 * Follows CLAUDE.md patterns for form handling.
 */

import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { type Resolver, type SubmitHandler, useForm } from 'react-hook-form'

import {
  type EventFormData,
  EventFormSchema,
  getEventFormDefaults,
} from '~/components/forms/event/event-form.schema'
import {
  type EditingLanguage,
  LanguageSwitch,
  ReferenceNote,
} from '~/components/i18n/editing-language'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Switch } from '~/components/ui/switch'
import { Textarea } from '~/components/ui/textarea'
import { cn } from '~/lib/utils'
import type { Event } from '~/server/domains/event/event.types'

type ModernEventFormBaseProps = Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: EventFormData) => Promise<void> | void
  isSubmitting?: boolean
}>

type ModernEventFormProps =
  | (ModernEventFormBaseProps & {
      mode: 'create'
      event?: never
    })
  | (ModernEventFormBaseProps & {
      mode: 'edit'
      event: Event
    })

type SpanishEventText = { name: string; venue: string; attire: string; description: string }

/** Stored Spanish text for an event, as editable strings. */
function readSpanish(event: Event | undefined): SpanishEventText {
  const stored =
    typeof event?.translations === 'object' && event.translations !== null
      ? (event.translations as { es?: Partial<Record<keyof SpanishEventText, unknown>> }).es
      : undefined
  const text = (value: unknown) => (typeof value === 'string' ? value : '')
  return {
    name: text(stored?.name),
    venue: text(stored?.venue),
    attire: text(stored?.attire),
    description: text(stored?.description),
  }
}

/** Form values for an existing event, including its Spanish text. */
function toFormValues(event: Event): EventFormData {
  return {
    eventName: event.name,
    date: event.date ? format(new Date(event.date), 'yyyy-MM-dd') : '',
    startTime: event.startTime ?? '',
    endTime: event.endTime ?? '',
    venue: event.venue ?? '',
    attire: event.attire ?? '',
    description: event.description ?? '',
    collectRsvp: event.collectRsvp ?? false,
    allowTagAlongs: event.allowTagAlongs ?? false,
    translations: { es: readSpanish(event) },
  }
}

export function ModernEventForm({
  mode,
  open,
  onOpenChange,
  onSubmit,
  event,
  isSubmitting = false,
}: ModernEventFormProps) {
  const isEditMode = mode === 'edit'
  // Name, venue, attire and description can be written in English and Spanish;
  // date, times and switches are shared by both languages.
  const [language, setLanguage] = useState<EditingLanguage>('en')
  const translating = language === 'es'

  // Initialize form with defaults or event data
  const form = useForm<EventFormData>({
    resolver: zodResolver(EventFormSchema) as Resolver<EventFormData>,
    defaultValues: isEditMode ? toFormValues(event) : getEventFormDefaults(),
  })

  const { register, handleSubmit, formState, setValue, watch } = form
  const { errors, isDirty } = formState
  const dateValue = watch('date')
  const english = watch(['eventName', 'venue', 'attire', 'description'])
  const spanishErrors = errors.translations?.es

  const handleFormSubmit: SubmitHandler<EventFormData> = async (data) => {
    await onSubmit(data)
    // Don't close here - let parent's onSuccess handle closing
    // This ensures data is refetched before dialog closes
  }

  // Reset form when dialog opens or event changes
  useEffect(() => {
    if (open) {
      // When dialog opens, reset to event data or defaults
      form.reset(isEditMode ? toFormValues(event) : getEventFormDefaults())
      setLanguage('en')
    }
  }, [open, event, form, isEditMode])

  // Parse date string to Date object for calendar
  const selectedDate = dateValue ? new Date(dateValue) : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle className='text-xl md:text-2xl'>
            {isEditMode ? 'Edit Event' : 'Create Event'}
          </DialogTitle>
          <DialogDescription className='text-sm'>
            {isEditMode
              ? 'Update the details for your wedding event.'
              : 'Add a new event like ceremony, reception, or rehearsal dinner.'}
          </DialogDescription>
          <div className='flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between'>
            <p className='text-muted-foreground text-xs'>
              {translating
                ? 'Spanish text for Spanish-speaking guests. Blank fields show the English.'
                : 'Switch to ES to add Spanish text for your wedding website.'}
            </p>
            <LanguageSwitch value={language} onChange={setLanguage} label='Event language' />
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-4 md:space-y-6'>
          {/* Event Name */}
          <div className='space-y-2'>
            <Label htmlFor='eventName' className='text-sm md:text-base'>
              Event Name <span className='text-destructive'>*</span>
            </Label>
            {translating ? (
              <>
                <Input
                  key='eventName-es'
                  id='eventName'
                  lang='es'
                  {...register('translations.es.name')}
                  placeholder={english[0] || 'p. ej., Ceremonia religiosa'}
                  disabled={isSubmitting}
                  className={cn(spanishErrors?.name && 'border-destructive')}
                />
                {english[0] ? <ReferenceNote reference={english[0]} /> : null}
                {spanishErrors?.name && (
                  <p className='text-destructive text-xs md:text-sm'>
                    {spanishErrors.name.message}
                  </p>
                )}
              </>
            ) : (
              <>
                <Input
                  key='eventName-en'
                  id='eventName'
                  {...register('eventName')}
                  placeholder='e.g., Wedding Ceremony'
                  disabled={isSubmitting}
                  className={cn(errors.eventName && 'border-destructive')}
                />
                {errors.eventName && (
                  <p className='text-destructive text-xs md:text-sm'>{errors.eventName.message}</p>
                )}
              </>
            )}
          </div>

          {/* Date */}
          <div className='space-y-2'>
            <Label htmlFor='date' className='text-sm md:text-base'>
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {selectedDate ? (
                    format(selectedDate, 'PPP')
                  ) : (
                    <span className='text-xs md:text-sm'>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='single'
                  selected={selectedDate}
                  onSelect={(date) => {
                    setValue('date', date ? format(date, 'yyyy-MM-dd') : '', {
                      shouldDirty: true,
                    })
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className='text-destructive text-xs md:text-sm'>{errors.date.message}</p>
            )}
          </div>

          {/* Time Range */}
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='startTime' className='text-sm md:text-base'>
                Start Time
              </Label>
              <div className='relative'>
                <Clock className='pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  id='startTime'
                  type='time'
                  {...register('startTime')}
                  disabled={isSubmitting}
                  className='pl-10'
                />
              </div>
              {errors.startTime && (
                <p className='text-destructive text-xs md:text-sm'>{errors.startTime.message}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='endTime' className='text-sm md:text-base'>
                End Time
              </Label>
              <div className='relative'>
                <Clock className='pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  id='endTime'
                  type='time'
                  {...register('endTime')}
                  disabled={isSubmitting}
                  className='pl-10'
                />
              </div>
              {errors.endTime && (
                <p className='text-destructive text-xs md:text-sm'>{errors.endTime.message}</p>
              )}
            </div>
          </div>

          {/* Venue */}
          <div className='space-y-2'>
            <Label htmlFor='venue' className='text-sm md:text-base'>
              Venue
            </Label>
            {translating ? (
              <>
                <Input
                  key='venue-es'
                  id='venue'
                  lang='es'
                  {...register('translations.es.venue')}
                  placeholder={english[1] || undefined}
                  disabled={isSubmitting}
                  className={cn(errors.venue && 'border-destructive')}
                />
                {english[1] ? <ReferenceNote reference={english[1]} /> : null}
              </>
            ) : (
              <Input
                key='venue-en'
                id='venue'
                {...register('venue')}
                placeholder="e.g., St. Mary's Church"
                disabled={isSubmitting}
                className={cn(errors.venue && 'border-destructive')}
              />
            )}
            {errors.venue && (
              <p className='text-destructive text-xs md:text-sm'>{errors.venue.message}</p>
            )}
          </div>

          {/* Attire */}
          <div className='space-y-2'>
            <Label htmlFor='attire' className='text-sm md:text-base'>
              Attire
            </Label>
            {translating ? (
              <>
                <Input
                  key='attire-es'
                  id='attire'
                  lang='es'
                  {...register('translations.es.attire')}
                  placeholder={english[2] || undefined}
                  disabled={isSubmitting}
                  className={cn(errors.attire && 'border-destructive')}
                />
                {english[2] ? <ReferenceNote reference={english[2]} /> : null}
              </>
            ) : (
              <Input
                key='attire-en'
                id='attire'
                {...register('attire')}
                placeholder='e.g., Black Tie, Cocktail Attire'
                disabled={isSubmitting}
                className={cn(errors.attire && 'border-destructive')}
              />
            )}
            {errors.attire && (
              <p className='text-destructive text-xs md:text-sm'>{errors.attire.message}</p>
            )}
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <Label htmlFor='description' className='text-sm md:text-base'>
              Description
            </Label>
            {translating ? (
              <>
                <Textarea
                  key='description-es'
                  id='description'
                  lang='es'
                  {...register('translations.es.description')}
                  placeholder={english[3] || undefined}
                  rows={3}
                  disabled={isSubmitting}
                  className={cn(errors.description && 'border-destructive', 'resize-none')}
                />
                {english[3] ? <ReferenceNote reference={english[3]} /> : null}
              </>
            ) : (
              <Textarea
                key='description-en'
                id='description'
                {...register('description')}
                placeholder='Add any additional details about the event...'
                rows={3}
                disabled={isSubmitting}
                className={cn(errors.description && 'border-destructive', 'resize-none')}
              />
            )}
            {errors.description && (
              <p className='text-destructive text-xs md:text-sm'>{errors.description.message}</p>
            )}
          </div>

          {/* Collect RSVPs */}
          <div className='flex items-center justify-between rounded-lg border bg-muted/50 p-4'>
            <div className='space-y-0.5'>
              <Label htmlFor='collectRsvp' className='text-sm md:text-base'>
                Collect RSVPs
              </Label>
              <p className='text-muted-foreground text-xs'>
                Turn this on to show this event in your public RSVP flow
              </p>
            </div>
            <Switch
              id='collectRsvp'
              checked={watch('collectRsvp') ?? false}
              onCheckedChange={(checked) => {
                setValue('collectRsvp', checked, { shouldDirty: true })
              }}
              disabled={isSubmitting}
            />
          </div>
          {/* Allow Tag-Alongs */}
          <div className='flex items-center justify-between rounded-lg border bg-muted/50 p-4'>
            <div className='space-y-0.5'>
              <Label htmlFor='allowTagAlongs' className='text-sm md:text-base'>
                Allow tag-alongs
              </Label>
              <p className='text-muted-foreground text-xs'>
                Tag-alongs can be invited and RSVP for this event
              </p>
            </div>
            <Switch
              id='allowTagAlongs'
              checked={watch('allowTagAlongs') ?? false}
              onCheckedChange={(checked) => {
                setValue('allowTagAlongs', checked, { shouldDirty: true })
              }}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className='gap-2 sm:gap-0'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className='text-xs md:text-sm'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting || !isDirty}
              className='text-xs md:text-sm'
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Event' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
