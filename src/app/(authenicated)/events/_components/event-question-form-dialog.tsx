'use client'

import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { Option, Question } from '~/app/utils/shared-types'
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
import { api } from '~/trpc/react'

type QuestionDraftOption = {
  id?: string
  text: string
  description: string
}

type EventQuestionFormDialogProps = Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  initialQuestion?: Question
  onSaved: () => Promise<void> | void
}>

const normalizeOptions = (options?: Option[]): QuestionDraftOption[] => {
  if (!options || options.length === 0) {
    return [
      { text: '', description: '' },
      { text: '', description: '' },
    ]
  }

  return options.map((option) => ({
    id: option.id,
    text: option.text,
    description: option.description,
  }))
}

export function EventQuestionFormDialog({
  open,
  onOpenChange,
  eventId,
  initialQuestion,
  onSaved,
}: EventQuestionFormDialogProps) {
  const isEditMode = initialQuestion !== undefined
  const [questionText, setQuestionText] = useState('')
  const [questionType, setQuestionType] = useState<'Text' | 'Option'>('Text')
  const [allowOther, setAllowOther] = useState(false)
  const [options, setOptions] = useState<QuestionDraftOption[]>(normalizeOptions())
  const [deletedOptionIds, setDeletedOptionIds] = useState<string[]>([])

  useEffect(() => {
    if (!open) return

    setQuestionText(initialQuestion?.text ?? '')
    setQuestionType((initialQuestion?.type as 'Text' | 'Option' | undefined) ?? 'Text')
    setAllowOther(initialQuestion?.allowOther ?? false)
    setOptions(normalizeOptions(initialQuestion?.options))
    setDeletedOptionIds([])
  }, [open, initialQuestion])

  const isQuestionValid = useMemo(() => questionText.trim().length > 0, [questionText])

  const validOptionCount = useMemo(() => {
    if (questionType !== 'Option') return 0
    return options.filter((option) => option.text.trim().length > 0).length
  }, [options, questionType])

  const upsertQuestion = api.question.upsert.useMutation({
    onSuccess: async () => {
      toast.success(isEditMode ? 'Question updated' : 'Question added')
      await onSaved()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error('Failed to save question', {
        description: error.message,
      })
    },
  })

  const handleAddOption = () => {
    setOptions((previous) => [...previous, { text: '', description: '' }])
  }

  const handleRemoveOption = (index: number) => {
    setOptions((previous) => {
      const candidate = previous[index]
      if (candidate?.id) {
        setDeletedOptionIds((current) => [...current, candidate.id as string])
      }

      const next = previous.filter((_, optionIndex) => optionIndex !== index)
      return next.length >= 2 ? next : [...next, { text: '', description: '' }]
    })
  }

  const handleOptionChange = (
    index: number,
    key: keyof QuestionDraftOption,
    value: string
  ): void => {
    setOptions((previous) =>
      previous.map((option, optionIndex) =>
        optionIndex === index ? { ...option, [key]: value } : option
      )
    )
  }

  const handleSubmit = () => {
    if (!isQuestionValid) return

    if (questionType === 'Option' && validOptionCount < 2) {
      toast.error('Add at least two answer options')
      return
    }

    const existingOptionIds =
      questionType === 'Text' ? (initialQuestion?.options ?? []).map((option) => option.id) : []

    upsertQuestion.mutate({
      questionId: initialQuestion?.id,
      eventId,
      text: questionText.trim(),
      type: questionType,
      isRequired: questionType === 'Option',
      allowOther: questionType === 'Option' ? allowOther : false,
      options:
        questionType === 'Option'
          ? options
              .filter((option) => option.text.trim().length > 0)
              .map((option) => ({
                id: option.id,
                text: option.text.trim(),
                description: option.description.trim(),
              }))
          : undefined,
      deletedOptions:
        questionType === 'Text'
          ? existingOptionIds
          : deletedOptionIds.length > 0
            ? deletedOptionIds
            : undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit RSVP Question' : 'Add RSVP Question'}</DialogTitle>
          <DialogDescription>
            This question is shown only for this event when guests RSVP.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='event-question-text'>Question</Label>
            <Input
              id='event-question-text'
              value={questionText}
              onChange={(event) => setQuestionText(event.target.value)}
              placeholder='e.g., Meal preference?'
              disabled={upsertQuestion.isPending}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='event-question-type'>Type</Label>
            <select
              id='event-question-type'
              className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background'
              value={questionType}
              onChange={(event) => setQuestionType(event.target.value as 'Text' | 'Option')}
              disabled={upsertQuestion.isPending}
            >
              <option value='Text'>Short Answer</option>
              <option value='Option'>Multiple Choice</option>
            </select>
          </div>

          {questionType === 'Option' ? (
            <div className='space-y-3 rounded-md border p-3'>
              <div className='flex items-center justify-between'>
                <Label>Answer options</Label>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleAddOption}
                  disabled={upsertQuestion.isPending}
                >
                  <Plus className='mr-1 h-4 w-4' />
                  Add option
                </Button>
              </div>
              <p className='text-muted-foreground text-xs'>
                Guests must answer multiple-choice questions.
              </p>
              <p className='text-muted-foreground text-xs'>
                Enable <strong>Other</strong> when guests should be able to write in a custom answer
                in public RSVP.
              </p>
              <label
                htmlFor='event-question-allow-other'
                className='flex items-center gap-2 font-medium text-sm'
              >
                <input
                  id='event-question-allow-other'
                  type='checkbox'
                  checked={allowOther}
                  onChange={(event) => setAllowOther(event.target.checked)}
                  disabled={upsertQuestion.isPending}
                />
                Allow Other write-in answer
              </label>
              <div className='space-y-2'>
                {options.map((option, index) => (
                  <div
                    key={option.id ?? `option-${index}`}
                    className='grid grid-cols-[1fr_1fr_auto] gap-2'
                  >
                    <Input
                      value={option.text}
                      onChange={(event) => handleOptionChange(index, 'text', event.target.value)}
                      placeholder='Option label'
                      disabled={upsertQuestion.isPending}
                    />
                    <Input
                      value={option.description}
                      onChange={(event) =>
                        handleOptionChange(index, 'description', event.target.value)
                      }
                      placeholder='Optional description'
                      disabled={upsertQuestion.isPending}
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => handleRemoveOption(index)}
                      disabled={upsertQuestion.isPending || options.length <= 2}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type='button'
            onClick={handleSubmit}
            disabled={upsertQuestion.isPending || !isQuestionValid}
          >
            {upsertQuestion.isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
            {isEditMode ? 'Save changes' : 'Add question'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
