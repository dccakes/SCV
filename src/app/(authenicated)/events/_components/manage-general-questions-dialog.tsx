'use client'

import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { EventQuestionFormDialog } from '@/app/(authenicated)/events/_components/event-question-form-dialog'
import type { Question } from '~/app/utils/shared-types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { api } from '~/trpc/react'
import type { RouterOutputs } from '~/trpc/shared'

type WebsiteQuestions = NonNullable<RouterOutputs['question']['getWebsiteQuestions']>
type WebsiteQuestion = WebsiteQuestions['questions'][number]

type ManageGeneralQuestionsDialogProps = Readonly<{
  websiteId: string
  isRsvpEnabled: boolean
  questions: WebsiteQuestion[]
  open: boolean
  onOpenChange: (open: boolean) => void
}>

export function ManageGeneralQuestionsDialog({
  websiteId,
  isRsvpEnabled,
  questions,
  open,
  onOpenChange,
}: ManageGeneralQuestionsDialogProps) {
  const utils = api.useUtils()
  const [editingQuestion, setEditingQuestion] = useState<Question | undefined>(undefined)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deletingQuestion, setDeletingQuestion] = useState<WebsiteQuestion | undefined>(undefined)

  const questionList = useMemo(() => questions ?? [], [questions])

  const handleSaved = async () => {
    await utils.question.getWebsiteQuestions.invalidate()
  }

  const deleteQuestion = api.question.delete.useMutation({
    onSuccess: async () => {
      toast.success('Question deleted')
      setDeletingQuestion(undefined)
      await utils.question.getWebsiteQuestions.invalidate()
    },
    onError: (error) => {
      toast.error('Failed to delete question', {
        description: error.message,
      })
    },
  })

  const openCreateForm = () => {
    setEditingQuestion(undefined)
    setIsFormOpen(true)
  }

  const openEditForm = (question: WebsiteQuestion) => {
    setEditingQuestion(question)
    setIsFormOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>General RSVP Questions</DialogTitle>
            <DialogDescription>
              Asked of every guest who RSVPs, whether they accept or decline — for example a note to
              the couple or a question about children.
            </DialogDescription>
          </DialogHeader>

          {!isRsvpEnabled ? (
            <div className='rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900 text-sm'>
              Turn on <strong>online RSVP</strong> for your website to collect answers to these
              questions.
            </div>
          ) : null}

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <p className='text-muted-foreground text-sm'>
                {questionList.length} {questionList.length === 1 ? 'question' : 'questions'}
              </p>
              <Button type='button' size='sm' onClick={openCreateForm} disabled={!isRsvpEnabled}>
                <Plus className='mr-1 h-4 w-4' />
                Add question
              </Button>
            </div>
            <p className='text-muted-foreground text-xs'>
              Multiple-choice questions can optionally include an <strong>Other</strong> write-in
              answer in public RSVP.
            </p>

            {questionList.length === 0 ? (
              <div className='rounded-md border border-dashed p-6 text-center text-muted-foreground text-sm'>
                No general questions yet.
              </div>
            ) : (
              <ul className='space-y-2'>
                {questionList.map((question) => (
                  <li
                    key={question.id}
                    className='flex items-start justify-between rounded-md border p-3 md:items-center'
                  >
                    <div>
                      <p className='font-medium text-sm'>{question.text}</p>
                      <div className='mt-1 flex flex-wrap items-center gap-2'>
                        <Badge variant='outline'>
                          {question.type === 'Option' ? 'Multiple choice' : 'Short answer'}
                        </Badge>
                        {question.type === 'Option' ? (
                          <>
                            <span className='text-muted-foreground text-xs'>
                              {question.options?.length ?? 0} options
                            </span>
                            {question.allowOther ? (
                              <Badge variant='secondary'>Other enabled</Badge>
                            ) : null}
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Button
                        type='button'
                        size='icon'
                        variant='ghost'
                        onClick={() => openEditForm(question)}
                        aria-label={`Edit question ${question.text}`}
                      >
                        <Pencil className='h-4 w-4' />
                      </Button>
                      <Button
                        type='button'
                        size='icon'
                        variant='ghost'
                        onClick={() => setDeletingQuestion(question)}
                        aria-label={`Delete question ${question.text}`}
                      >
                        <Trash2 className='h-4 w-4 text-destructive' />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EventQuestionFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        websiteId={websiteId}
        initialQuestion={editingQuestion}
        onSaved={handleSaved}
      />

      <AlertDialog
        open={deletingQuestion !== undefined}
        onOpenChange={(open) => !open && setDeletingQuestion(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete general question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete “{deletingQuestion?.text}” and any collected answers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteQuestion.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              disabled={deleteQuestion.isPending}
              onClick={(eventAction) => {
                eventAction.preventDefault()
                if (!deletingQuestion?.id) return
                deleteQuestion.mutate({ questionId: deletingQuestion.id })
              }}
            >
              {deleteQuestion.isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
