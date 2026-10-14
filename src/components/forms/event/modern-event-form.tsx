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
import { type Resolver, type SubmitHandler, type UseFormReturn, useForm } from 'react-hook-form'

import {
  type EventFormData,
  EventFormSchema,
  getEventFormDefaults,
} from '~/components/forms/event/event-form.schema'
import {
  type EditingLanguage,
  LanguageSwitchHeader,
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
import { readEventTranslations } from '~/lib/i18n/translations'
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

/** Form values for an existing event, including its Spanish text. */
function toFormValues(event: Event): EventFormData {
  const spanish = readEventTranslations(event.translations)?.es
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
    translations: {
      es: {
        name: spanish?.name ?? '',
        venue: spanish?.venue ?? '',
        attire: spanish?.attire ?? '',
        description: spanish?.description ?? '',
      },
    },
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
          <LanguageSwitchHeader
            value={language}
            onChange={setLanguage}
            label='Event language'
            englishHint='Switch to ES to add Spanish text for your wedding website.'
          />
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit, (invalid) => {
            // Show the Spanish fields when only they fail, so the error is visible.
            if (invalid.translations && !invalid.eventName) setLanguage('es')
          })}
          className='space-y-4 md:space-y-6'
        >
          <BilingualField
            form={form}
            name='eventName'
            label='Event Name'
            required
            placeholder='e.g., Wedding Ceremony'
            translating={translating}
            disabled={isSubmitting}
          />

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

          <BilingualField
            form={form}
            name='venue'
            label='Venue'
            placeholder="e.g., St. Mary's Church"
            translating={translating}
            disabled={isSubmitting}
          />

          <BilingualField
            form={form}
            name='attire'
            label='Attire'
            placeholder='e.g., Black Tie, Cocktail Attire'
            translating={translating}
            disabled={isSubmitting}
          />

          <BilingualField
            form={form}
            name='description'
            label='Description'
            placeholder='Add any additional details about the event...'
            multiline
            translating={translating}
            disabled={isSubmitting}
          />

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

/** English fields that also have a Spanish version, mapped to their Spanish key. */
const SPANISH_KEY = {
  eventName: 'name',
  venue: 'venue',
  attire: 'attire',
  description: 'description',
} as const

/**
 * One event text field that edits English, or its Spanish translation (with the
 * English shown as placeholder and note) while translating.
 */
function BilingualField({
  form,
  name,
  label,
  placeholder,
  required = false,
  multiline = false,
  translating,
  disabled,
}: Readonly<{
  form: UseFormReturn<EventFormData>
  name: keyof typeof SPANISH_KEY
  label: string
  placeholder: string
  required?: boolean
  multiline?: boolean
  translating: boolean
  disabled: boolean
}>) {
  const spanishKey = SPANISH_KEY[name]
  const path = translating ? (`translations.es.${spanishKey}` as const) : name
  const english = form.watch(name) || undefined
  const { errors } = form.formState
  const error = translating ? errors.translations?.es?.[spanishKey] : errors[name]
  const controlProps = {
    id: name,
    lang: translating ? 'es' : undefined,
    ...form.register(path),
    placeholder: translating ? english : placeholder,
    disabled,
  }

  return (
    <div className='space-y-2'>
      <Label htmlFor={name} className='text-sm md:text-base'>
        {label} {required ? <span className='text-destructive'>*</span> : null}
      </Label>
      {multiline ? (
        <Textarea
          key={path}
          {...controlProps}
          rows={3}
          className={cn(error && 'border-destructive', 'resize-none')}
        />
      ) : (
        <Input key={path} {...controlProps} className={cn(error && 'border-destructive')} />
      )}
      {translating && english ? <ReferenceNote reference={english} /> : null}
      {error?.message ? (
        <p className='text-destructive text-xs md:text-sm'>{error.message}</p>
      ) : null}
    </div>
  )
}
