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
import { useEffect } from 'react'
import { type SubmitHandler, useForm } from 'react-hook-form'

import {
  type EventFormData,
  EventFormSchema,
  getEventFormDefaults,
} from '~/app/_components/forms/event/event-form.schema'
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
import { Textarea } from '~/components/ui/textarea'
import { cn } from '~/lib/utils'
import { type Event } from '~/server/domains/event/event.types'

type ModernEventFormProps = Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: EventFormData) => Promise<void> | void
  event?: Event // If provided, form is in edit mode
  isSubmitting?: boolean
}>

export function ModernEventForm({
  open,
  onOpenChange,
  onSubmit,
  event,
  isSubmitting = false,
}: ModernEventFormProps) {
  const isEditMode = !!event

  // Initialize form with defaults or event data
  const form = useForm<EventFormData>({
    resolver: zodResolver(EventFormSchema),
    defaultValues: event
      ? {
          eventName: event.name,
          date: event.date ? format(new Date(event.date), 'yyyy-MM-dd') : '',
          startTime: event.startTime ?? '',
          endTime: event.endTime ?? '',
          venue: event.venue ?? '',
          attire: event.attire ?? '',
          description: event.description ?? '',
        }
      : getEventFormDefaults(),
  })

  const { register, handleSubmit, formState, setValue, watch } = form
  const { errors, isDirty } = formState
  const dateValue = watch('date')

  const handleFormSubmit: SubmitHandler<EventFormData> = async (data) => {
    await onSubmit(data)
    // Don't close here - let parent's onSuccess handle closing
    // This ensures data is refetched before dialog closes
  }

  // Reset form when dialog closes or event changes
  useEffect(() => {
    if (!open) {
      form.reset(
        event
          ? {
              eventName: event.name,
              date: event.date ? format(new Date(event.date), 'yyyy-MM-dd') : '',
              startTime: event.startTime ?? '',
              endTime: event.endTime ?? '',
              venue: event.venue ?? '',
              attire: event.attire ?? '',
              description: event.description ?? '',
            }
          : getEventFormDefaults()
      )
    }
  }, [open, event, form])

  // Parse date string to Date object for calendar
  const selectedDate = dateValue ? new Date(dateValue) : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl">
            {isEditMode ? 'Edit Event' : 'Create Event'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isEditMode
              ? 'Update the details for your wedding event.'
              : 'Add a new event like ceremony, reception, or rehearsal dinner.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 md:space-y-6">
          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="eventName" className="text-sm md:text-base">
              Event Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="eventName"
              {...register('eventName')}
              placeholder="e.g., Wedding Ceremony"
              disabled={isSubmitting}
              className={cn(errors.eventName && 'border-destructive')}
            />
            {errors.eventName && (
              <p className="text-xs text-destructive md:text-sm">{errors.eventName.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm md:text-base">
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, 'PPP')
                  ) : (
                    <span className="text-xs md:text-sm">Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
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
              <p className="text-xs text-destructive md:text-sm">{errors.date.message}</p>
            )}
          </div>

          {/* Time Range */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-sm md:text-base">
                Start Time
              </Label>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="startTime"
                  type="time"
                  {...register('startTime')}
                  disabled={isSubmitting}
                  className="pl-10"
                />
              </div>
              {errors.startTime && (
                <p className="text-xs text-destructive md:text-sm">{errors.startTime.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime" className="text-sm md:text-base">
                End Time
              </Label>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="endTime"
                  type="time"
                  {...register('endTime')}
                  disabled={isSubmitting}
                  className="pl-10"
                />
              </div>
              {errors.endTime && (
                <p className="text-xs text-destructive md:text-sm">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          {/* Venue */}
          <div className="space-y-2">
            <Label htmlFor="venue" className="text-sm md:text-base">
              Venue
            </Label>
            <Input
              id="venue"
              {...register('venue')}
              placeholder="e.g., St. Mary's Church"
              disabled={isSubmitting}
              className={cn(errors.venue && 'border-destructive')}
            />
            {errors.venue && (
              <p className="text-xs text-destructive md:text-sm">{errors.venue.message}</p>
            )}
          </div>

          {/* Attire */}
          <div className="space-y-2">
            <Label htmlFor="attire" className="text-sm md:text-base">
              Attire
            </Label>
            <Input
              id="attire"
              {...register('attire')}
              placeholder="e.g., Black Tie, Cocktail Attire"
              disabled={isSubmitting}
              className={cn(errors.attire && 'border-destructive')}
            />
            {errors.attire && (
              <p className="text-xs text-destructive md:text-sm">{errors.attire.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm md:text-base">
              Description
            </Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Add any additional details about the event..."
              rows={3}
              disabled={isSubmitting}
              className={cn(errors.description && 'border-destructive', 'resize-none')}
            />
            {errors.description && (
              <p className="text-xs text-destructive md:text-sm">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs md:text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="text-xs md:text-sm"
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Event' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
