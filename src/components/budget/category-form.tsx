'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import type { BudgetCategoryWithExpenses } from '~/server/domains/budget/budget.types'
import { api } from '~/trpc/react'

type CategoryFormBaseProps = {
  onSuccess: () => void
  onCancel: () => void
}

type CategoryFormProps =
  | (CategoryFormBaseProps & { mode: 'create'; category?: never })
  | (CategoryFormBaseProps & { mode: 'edit'; category: BudgetCategoryWithExpenses })

export function CategoryForm(props: Readonly<CategoryFormProps>) {
  const { mode, onSuccess, onCancel } = props
  const isEditing = mode === 'edit'
  const category = mode === 'edit' ? props.category : undefined
  const utils = api.useUtils()

  const [name, setName] = useState(category?.name ?? '')
  const [plannedAmount, setPlannedAmount] = useState(category ? String(category.plannedAmount) : '')

  const invalidate = () => utils.budget.getOverview.invalidate()

  const createCategory = api.budget.createCategory.useMutation({
    onSuccess: async () => {
      await invalidate()
      toast.success('Section added')
      onSuccess()
    },
    onError: (err) => toast.error(err.message || 'Could not add section'),
  })

  const updateCategory = api.budget.updateCategory.useMutation({
    onSuccess: async () => {
      await invalidate()
      toast.success('Section updated')
      onSuccess()
    },
    onError: (err) => toast.error(err.message || 'Could not update section'),
  })

  const isPending = createCategory.isPending || updateCategory.isPending

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      toast.error('Section name is required')
      return
    }
    const parsed = plannedAmount ? Number.parseFloat(plannedAmount) : 0
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error('Enter a valid planned amount')
      return
    }

    if (isEditing && category) {
      updateCategory.mutate({ categoryId: category.id, name: name.trim(), plannedAmount: parsed })
    } else {
      createCategory.mutate({ name: name.trim(), plannedAmount: parsed })
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='space-y-1.5'>
        <Label htmlFor='category-name'>Section name</Label>
        <Input
          id='category-name'
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='e.g. Venue, Catering, Attire'
          maxLength={100}
          required
        />
      </div>
      <div className='space-y-1.5'>
        <Label htmlFor='category-planned'>Planned budget (USD)</Label>
        <Input
          id='category-planned'
          type='number'
          inputMode='decimal'
          min='0'
          step='0.01'
          value={plannedAmount}
          onChange={(e) => setPlannedAmount(e.target.value)}
          placeholder='0.00'
        />
      </div>
      <div className='flex justify-end gap-2 pt-1'>
        <Button type='button' variant='outline' onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type='submit' disabled={isPending}>
          {isEditing ? 'Save changes' : 'Add section'}
        </Button>
      </div>
    </form>
  )
}
