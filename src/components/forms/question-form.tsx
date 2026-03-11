'use client'

import { useRouter } from 'next/navigation'
import { type Dispatch, type SetStateAction, useState } from 'react'
import { IoMdClose } from 'react-icons/io'
import { sharedStyles } from '~/app/utils/shared-styles'
import type { Question, TQuestionOption } from '~/app/utils/shared-types'
import AnimatedInputLabel from '~/components/forms/animated-input-label'
import DeleteConfirmation from '~/components/forms/delete-confirmation'
import QuestionOptionsForm from '~/components/forms/rsvp/question-option-form'
import SidePaneWrapper from '~/components/forms/wrapper'
import { AsyncState } from '~/components/ui/async-state'
import { api } from '~/trpc/react'

const defaultQuestionOptions: TQuestionOption[] = [
  {
    text: '',
    description: '',
  },
  {
    text: '',
    description: '',
  },
]

type QuestionFormProps = {
  isEditMode: boolean
  question: Question
  setShowQuestionForm: Dispatch<SetStateAction<boolean>>
}

const getMutationErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) return error.message

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }

  return fallback
}

export default function QuestionForm({
  isEditMode,
  question,
  setShowQuestionForm,
}: QuestionFormProps) {
  const router = useRouter()
  const [deletedOptions, setDeletedOptions] = useState<string[]>([])
  const [questionOptions, setQuestionOptions] = useState<TQuestionOption[]>(
    question.options && question.options.length > 1 ? question.options : defaultQuestionOptions
  )
  const [questionType, setQuestionType] = useState<string>(question.type ?? 'Text')
  const [questionInput, setQuestionInput] = useState<string>(question.text ?? '')
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false)
  const [formError, setFormError] = useState<string | null>(null)

  const upsertQuestion = api.question.upsert.useMutation({
    onSuccess: () => {
      setFormError(null)
      setShowQuestionForm(false)
      router.refresh()
    },
    onError: (err) => {
      setFormError(getMutationErrorMessage(err, 'Failed to update question. Please try again.'))
    },
  })

  const deleteQuestion = api.question.delete.useMutation({
    onSuccess: () => {
      setFormError(null)
      setShowQuestionForm(false)
      router.refresh()
    },
    onError: (err) => {
      setFormError(getMutationErrorMessage(err, 'Failed to delete question. Please try again.'))
    },
  })

  const handleOnChange = ({ inputValue }: { inputValue: string }) => {
    setQuestionInput(inputValue)
  }

  const handleOnSubmit = () => {
    setFormError(null)
    // delete options in db when changing the question type to Option from Text
    let deleteOptions = deletedOptions
    if (question.type === 'Option' && questionType === 'Text') {
      deleteOptions = question.options?.map((option) => option.id) ?? []
    }
    upsertQuestion.mutate({
      type: questionType,
      text: questionInput,
      isRequired: questionType === 'Option',
      eventId: question.eventId,
      websiteId: question.websiteId,
      questionId: question.id,
      options: questionType === 'Option' ? questionOptions : undefined,
      deletedOptions: deleteOptions,
    })
  }

  const isProcessing = upsertQuestion.isPending || deleteQuestion.isPending

  if (showDeleteConfirmation) {
    return (
      <DeleteConfirmation
        isProcessing={deleteQuestion.isPending}
        disclaimerText={
          "This will permanently delete the question and any answers you've already received."
        }
        noHandler={() => setShowDeleteConfirmation(false)}
        yesHandler={() =>
          deleteQuestion.mutate({
            questionId: question.id ?? '',
          })
        }
      />
    )
  }

  return (
    <SidePaneWrapper>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleOnSubmit()
        }}
        className='pb-32'
      >
        <div className='flex justify-between border-b p-5'>
          <h1 className='font-semibold text-xl'>Add Question</h1>
          <button
            type='button'
            aria-label='Close question form'
            onClick={() => setShowQuestionForm(false)}
            className='rounded-md text-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          >
            <IoMdClose size={25} />
          </button>
        </div>
        <div className='bg-pink-100 px-5 py-3'>
          <b>FYI: </b>
          <span>
            Guests can only skip short-answer questions. They must answer multiple-choice questions.
          </span>
        </div>
        <AsyncState error={formError} className='mt-5 px-5' />
        <div className='mt-7 px-5'>
          <AnimatedInputLabel
            id='question-input'
            inputValue={questionInput}
            labelText='Question Prompt*'
            required={true}
            handleOnChange={handleOnChange}
          />
          <div className='flex gap-5 py-5'>
            <div className='flex items-center gap-2'>
              <input
                type='radio'
                id='short-answer'
                checked={questionType === 'Text'}
                onChange={() => setQuestionType('Text')}
                className='h-6 w-6'
              />
              <label htmlFor='short-answer'>Short Answer</label>
            </div>
            <div className='flex items-center gap-2'>
              <input
                type='radio'
                id='multiple-choice'
                checked={questionType === 'Option'}
                onChange={() => setQuestionType('Option')}
                className='h-6 w-6'
              />
              <label htmlFor='multiple-choice'>Multiple Choice</label>
            </div>
          </div>
        </div>
        {questionType === 'Option' && (
          <QuestionOptionsForm
            questionOptions={questionOptions}
            setQuestionOptions={setQuestionOptions}
            setDeletedOptions={setDeletedOptions}
          />
        )}
        <Buttons
          isEditMode={isEditMode}
          isProcessing={isProcessing}
          setShowQuestionForm={setShowQuestionForm}
          setShowDeleteConfirmation={setShowDeleteConfirmation}
        />
      </form>
    </SidePaneWrapper>
  )
}

const Buttons = ({
  isEditMode,
  isProcessing,
  setShowQuestionForm,
  setShowDeleteConfirmation,
}: {
  isEditMode: boolean
  isProcessing: boolean
  setShowQuestionForm: Dispatch<SetStateAction<boolean>>
  setShowDeleteConfirmation: Dispatch<SetStateAction<boolean>>
}) => {
  return (
    <div
      className={`fixed bottom-0 z-20 flex ${sharedStyles.sidebarFormWidth} flex-col gap-3 border-t bg-white px-3 py-5`}
    >
      <div className='flex gap-3 text-sm'>
        <button
          type='button'
          disabled={isProcessing}
          onClick={() => setShowQuestionForm(false)}
          className={`w-1/2 ${sharedStyles.secondaryButton({
            py: 'py-2',
            isLoading: isProcessing,
          })}`}
        >
          Cancel
        </button>
        <button
          type='submit'
          disabled={isProcessing}
          className={`w-1/2 ${sharedStyles.primaryButton({
            px: 'px-2',
            py: 'py-2',
            isLoading: isProcessing,
          })}`}
        >
          {isProcessing ? 'Processing...' : 'Save'}
        </button>
      </div>
      {isEditMode && (
        <button
          type='button'
          onClick={(e) => {
            e.preventDefault()
            setShowDeleteConfirmation(true)
          }}
          className={`font-bold text-sm ${
            isProcessing
              ? 'cursor-not-allowed text-pink-200'
              : `${sharedStyles.primaryText} hover:underline`
          }`}
        >
          {isProcessing ? 'Processing...' : 'Delete Question'}
        </button>
      )}
    </div>
  )
}
