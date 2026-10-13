'use client'

import { toNestErrors } from '@hookform/resolvers'
import { useEffect, useRef } from 'react'
import { type FieldErrors, type Resolver, useForm } from 'react-hook-form'
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
import { cn } from '~/lib/utils'
import { MAX_TABLE_CAPACITY, MIN_TABLE_CAPACITY } from '~/server/domains/seating/seating.rules'
import { seatingTableShapeSchema } from '~/server/domains/seating/seating.validator'

export const seatingTableFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Table name is required')
    .max(50, 'Table name must be 50 characters or less'),
  shape: seatingTableShapeSchema,
  capacity: z
    .number({ error: 'Enter how many seats this table has' })
    .int('Seats must be a whole number')
    .min(MIN_TABLE_CAPACITY, `At least ${MIN_TABLE_CAPACITY} seat`)
    .max(MAX_TABLE_CAPACITY, `At most ${MAX_TABLE_CAPACITY} seats`),
})

export type SeatingTableFormValues = z.infer<typeof seatingTableFormSchema>

// @hookform/resolvers v3 does not map zod 4 errors, so parse and map them here
const seatingTableResolver: Resolver<SeatingTableFormValues> = (values, _context, options) => {
  const result = seatingTableFormSchema.safeParse(values)
  if (result.success) return { values: result.data, errors: {} }

  const errors: Record<string, { type: string; message: string }> = {}
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? 'root')
    errors[field] ??= { type: issue.code, message: issue.message }
  }
  return {
    values: {},
    errors: toNestErrors(errors as FieldErrors<SeatingTableFormValues>, options),
  }
}

type SeatingTableDialogProps = {
  mode: 'create' | 'edit'
  open: boolean
  defaultValues: SeatingTableFormValues
  minCapacity?: number
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: SeatingTableFormValues) => void
  onDelete?: () => void
}

const SHAPE_OPTIONS = [
  { value: 'ROUND', label: 'Round' },
  { value: 'RECTANGULAR', label: 'Rectangular' },
] as const

export function SeatingTableDialog(props: Readonly<SeatingTableDialogProps>) {
  const {
    mode,
    open,
    defaultValues,
    minCapacity = 0,
    isSubmitting,
    onOpenChange,
    onSubmit,
    onDelete,
  } = props

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
    watch,
  } = useForm<SeatingTableFormValues>({
    resolver: seatingTableResolver,
    defaultValues,
  })
  const selectedShape = watch('shape')

  // Load values only when the dialog opens, so data changing underneath an
  // open dialog (optimistic update, rollback, refetch) never wipes user input
  const wasOpen = useRef(false)
  useEffect(() => {
    if (open && !wasOpen.current) reset(defaultValues)
    wasOpen.current = open
  }, [open, defaultValues, reset])

  const submit = handleSubmit((values) => {
    if (values.capacity < minCapacity) {
      setError('capacity', {
        message: `${minCapacity} guests are seated here. Move guests before reducing seats.`,
      })
      return
    }
    onSubmit(values)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='font-display text-2xl italic'>
            {mode === 'create' ? 'Add table' : 'Edit table'}
          </DialogTitle>
          <DialogDescription>Pick a shape and how many guests it seats.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='seating-table-name'>Table name</Label>
            <Input id='seating-table-name' placeholder='e.g., Head Table' {...register('name')} />
            {errors.name ? <p className='text-destructive text-sm'>{errors.name.message}</p> : null}
          </div>

          <fieldset className='space-y-2'>
            <legend className='font-medium text-sm leading-none'>Shape</legend>
            <div className='grid grid-cols-2 gap-2'>
              {SHAPE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-[4px] border px-3 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                    selectedShape === option.value
                      ? 'border-foreground bg-foreground/[0.04]'
                      : 'border-input hover:bg-muted'
                  )}
                >
                  <input
                    type='radio'
                    value={option.value}
                    className='sr-only'
                    {...register('shape')}
                  />
                  <span
                    aria-hidden='true'
                    className={cn(
                      'inline-block border-2 border-current',
                      option.value === 'ROUND' ? 'h-5 w-5 rounded-full' : 'h-4 w-7 rounded-[2px]'
                    )}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className='space-y-2'>
            <Label htmlFor='seating-table-capacity'>Seats</Label>
            <Input
              id='seating-table-capacity'
              type='number'
              inputMode='numeric'
              min={Math.max(MIN_TABLE_CAPACITY, minCapacity)}
              max={MAX_TABLE_CAPACITY}
              {...register('capacity', { valueAsNumber: true })}
            />
            {errors.capacity ? (
              <p className='text-destructive text-sm'>{errors.capacity.message}</p>
            ) : null}
          </div>

          <DialogFooter className='gap-2 sm:justify-between'>
            {mode === 'edit' && onDelete ? (
              <Button type='button' variant='ghost' className='text-destructive' onClick={onDelete}>
                Delete table
              </Button>
            ) : (
              <span />
            )}
            <Button type='submit' disabled={isSubmitting}>
              {mode === 'create' ? 'Add table' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
