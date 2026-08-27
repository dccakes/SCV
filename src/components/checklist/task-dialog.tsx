'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '~/components/ui/button'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { TASK_CATEGORIES, type TaskCategoryValue } from '~/lib/constants/task-categories'
import type { EventWithStats } from '~/server/domains/event'
import type { Task } from '~/server/domains/task'

const taskDialogSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(200),
  category: z.enum(TASK_CATEGORIES),
  eventId: z.string().min(1, 'Event is required'),
  monthsBeforeWedding: z
    .string()
    .trim()
    .min(1, 'Months before wedding is required')
    .refine((value) => /^-?\d+$/.test(value), 'Months before wedding must be a whole number')
    .refine((value) => Number(value) >= -1, 'Months before wedding must be -1 or greater'),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
    .or(z.literal(''))
    .optional(),
  description: z.string().max(5000).or(z.literal('')).optional(),
  notes: z.string().max(5000).or(z.literal('')).optional(),
})

type TaskDialogFormData = z.input<typeof taskDialogSchema>

type TaskDialogSubmitData = {
  title: string
  category: TaskCategoryValue
  eventId: string
  monthsBeforeWedding: number
  dueDate: string | null
  description: string | null
  notes: string | null
}

type TaskDialogProps = Readonly<{
  mode: 'create' | 'edit'
  open: boolean
  onOpenChange: (open: boolean) => void
  events: EventWithStats[]
  task?: Task
  onSubmit: (data: TaskDialogSubmitData) => void
  onDelete?: () => void
  isSubmitting: boolean
}>

export function TaskDialog({
  mode,
  open,
  onOpenChange,
  events,
  task,
  onSubmit,
  onDelete,
  isSubmitting,
}: TaskDialogProps) {
  const primaryEventId = task?.eventId ?? events[0]?.id ?? ''

  const form = useForm<TaskDialogFormData>({
    resolver: zodResolver(taskDialogSchema),
    defaultValues: getDefaultValues(mode, primaryEventId, task),
  })

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = form

  useEffect(() => {
    if (!open) {
      return
    }

    reset(getDefaultValues(mode, primaryEventId, task))
  }, [mode, open, primaryEventId, reset, task])

  const submitForm = handleSubmit((data) => {
    onSubmit({
      title: data.title.trim(),
      category: data.category,
      eventId: data.eventId,
      monthsBeforeWedding: Number(data.monthsBeforeWedding),
      dueDate: data.dueDate ? data.dueDate : null,
      description: normalizeOptionalText(data.description),
      notes: normalizeOptionalText(data.notes),
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='font-display text-2xl italic'>
            {mode === 'create' ? 'Add task' : 'Edit task'}
          </DialogTitle>
          <DialogDescription>
            Keep the checklist grounded in what actually needs to happen next.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submitForm} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='task-title'>Task title</Label>
            <Input
              id='task-title'
              {...register('title')}
              placeholder='e.g., Book the string quartet'
            />
            {errors.title ? (
              <p className='text-destructive text-sm'>{errors.title.message}</p>
            ) : null}
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='task-category'>Category</Label>
              <Controller
                control={control}
                name='category'
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id='task-category' aria-label='Task category'>
                      <SelectValue placeholder='Select category' />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='task-event'>Event</Label>
              <Controller
                control={control}
                name='eventId'
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id='task-event' aria-label='Task event'>
                      <SelectValue placeholder='Select event' />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.eventId ? (
                <p className='text-destructive text-sm'>{errors.eventId.message}</p>
              ) : null}
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='task-months-before'>Months before wedding</Label>
              <Input
                id='task-months-before'
                type='number'
                {...register('monthsBeforeWedding')}
                placeholder='3'
              />
              {errors.monthsBeforeWedding ? (
                <p className='text-destructive text-sm'>{errors.monthsBeforeWedding.message}</p>
              ) : null}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='task-due-date'>Due date</Label>
              <Input id='task-due-date' type='date' {...register('dueDate')} />
              {errors.dueDate ? (
                <p className='text-destructive text-sm'>{errors.dueDate.message}</p>
              ) : null}
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='task-description'>Description</Label>
            <Textarea
              id='task-description'
              {...register('description')}
              placeholder='Optional context for the couple or planner.'
              rows={4}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='task-notes'>Notes</Label>
            <Textarea
              id='task-notes'
              {...register('notes')}
              placeholder='Optional notes.'
              rows={3}
            />
          </div>

          <DialogFooter>
            {mode === 'edit' && onDelete ? (
              <Button type='button' variant='ghost' onClick={onDelete} className='mr-auto'>
                Delete task
              </Button>
            ) : null}
            <Button type='button' variant='ghost' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {mode === 'create' ? 'Save task' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function getDefaultValues(
  mode: 'create' | 'edit',
  primaryEventId: string,
  task?: Task
): TaskDialogFormData {
  if (mode === 'edit' && task) {
    return {
      title: task.title,
      category: task.category,
      eventId: task.eventId,
      monthsBeforeWedding: String(task.monthsBeforeWedding),
      dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : '',
      description: task.description ?? '',
      notes: task.notes ?? '',
    }
  }

  return {
    title: '',
    category: 'OTHER',
    eventId: primaryEventId,
    monthsBeforeWedding: '3',
    dueDate: '',
    description: '',
    notes: '',
  }
}

function normalizeOptionalText(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}
