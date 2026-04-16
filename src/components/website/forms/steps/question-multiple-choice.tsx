'use client'

import { useState } from 'react'
import { IoIosCheckmarkCircleOutline } from 'react-icons/io'
import type { Guest, Question, StepFormProps } from '~/app/utils/shared-types'
import { useRsvpForm, useUpdateRsvpForm } from '~/components/contexts/rsvp-form-context'
import {
  type AnswerWithType,
  findExistingAnswer,
  removeAnswer,
  upsertAnswer,
} from '~/components/website/forms/rsvp-state'

interface QuestionMultipleChoiceProps extends StepFormProps {
  guest?: Guest
  question: Question
}

export default function QuestionMultipleChoice({
  goNext,
  goBack,
  guest,
  question,
}: QuestionMultipleChoiceProps) {
  const OTHER_OPTION_ID = '__other__'
  const rsvpFormData = useRsvpForm()
  const updateRsvpForm = useUpdateRsvpForm()
  const questionId = question.id ?? '-1'
  const answerTarget = {
    questionId,
    guestId: guest?.id,
    householdId: rsvpFormData.selectedHousehold?.id,
  }
  const existingAnswer = findExistingAnswer(rsvpFormData.answersToQuestions, answerTarget)
  const [selectedOptionId, setSelectedOptionId] = useState<string | undefined>(() => {
    if (!existingAnswer) return undefined
    if (existingAnswer.questionType === 'Text') {
      return question.allowOther ? OTHER_OPTION_ID : undefined
    }
    return existingAnswer.response
  })
  const [otherResponse, setOtherResponse] = useState<string>(
    existingAnswer?.questionType === 'Text' ? existingAnswer.response : ''
  )
  const isOtherSelected = question.allowOther === true && selectedOptionId === OTHER_OPTION_ID
  const canContinue =
    selectedOptionId !== undefined && (!isOtherSelected || otherResponse.trim().length > 0)

  return (
    <div className='flex flex-col gap-5'>
      <h2 className='text-2xl tracking-widest'>{question.text}</h2>
      {!!guest && (
        <span>
          {guest.firstName} {guest.lastName}
        </span>
      )}
      <ul>
        {question.options?.map((option) => (
          <li key={option.id}>
            <button
              type='button'
              onClick={() => setSelectedOptionId(option.id)}
              className={`relative mb-3 w-full cursor-pointer rounded-lg border border-gray-700 p-5 text-left hover:bg-gray-700 hover:text-white ${selectedOptionId === option.id && 'bg-gray-700 text-white'}`}
            >
              <div className='flex flex-col gap-3'>
                <h3>{option.text}</h3>
                <p>{option.description}</p>
              </div>
              {selectedOptionId === option.id && (
                <div className='absolute top-1/2 right-5 -translate-y-1/2'>
                  <IoIosCheckmarkCircleOutline size={20} />
                </div>
              )}
            </button>
          </li>
        ))}
        {question.allowOther ? (
          <li>
            <button
              type='button'
              onClick={() => setSelectedOptionId(OTHER_OPTION_ID)}
              className={`relative mb-3 w-full cursor-pointer rounded-lg border border-gray-700 p-5 text-left hover:bg-gray-700 hover:text-white ${isOtherSelected && 'bg-gray-700 text-white'}`}
            >
              <div className='flex flex-col gap-3'>
                <h3>Other</h3>
                <p>Enter your own answer</p>
              </div>
              {isOtherSelected && (
                <div className='absolute top-1/2 right-5 -translate-y-1/2'>
                  <IoIosCheckmarkCircleOutline size={20} />
                </div>
              )}
            </button>
          </li>
        ) : null}
      </ul>
      {isOtherSelected && (
        <textarea
          className='w-full rounded-lg border border-gray-700 p-3 text-left text-base'
          placeholder='Please share your answer'
          value={otherResponse}
          onChange={(event) => setOtherResponse(event.target.value)}
          rows={3}
        />
      )}
      <button
        className={`mt-3 bg-stone-400 py-3 text-white text-xl tracking-wide ${!canContinue ? 'cursor-not-allowed bg-stone-400' : 'bg-stone-700'}`}
        type='button'
        disabled={!canContinue}
        onClick={() => {
          const nextAnswer: AnswerWithType = {
            ...answerTarget,
            questionType: isOtherSelected ? 'Text' : 'Option',
            response: isOtherSelected ? otherResponse.trim() : (selectedOptionId ?? ''),
            guestFirstName:
              guest?.firstName ?? rsvpFormData.selectedHousehold?.primaryContact?.firstName,
            guestLastName:
              guest?.lastName ?? rsvpFormData.selectedHousehold?.primaryContact?.lastName,
          }
          updateRsvpForm({
            answersToQuestions: upsertAnswer(rsvpFormData.answersToQuestions, nextAnswer),
          })
          goNext?.()
        }}
      >
        CONTINUE
      </button>
      {!question.isRequired && (
        <button
          className={`mt-3 bg-gray-700 py-3 text-white text-xl tracking-wide`}
          type='button'
          onClick={() => {
            updateRsvpForm({
              answersToQuestions: removeAnswer(rsvpFormData.answersToQuestions, answerTarget),
            })
            goNext?.()
          }}
        >
          SKIP
        </button>
      )}
      <button
        className={`mt-3 bg-gray-700 py-3 text-white text-xl tracking-wide`}
        type='submit'
        onClick={() => goBack?.()}
      >
        BACK
      </button>
    </div>
  )
}
