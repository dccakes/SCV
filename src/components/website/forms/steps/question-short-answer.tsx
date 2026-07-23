'use client'

import { useState } from 'react'
import type { Guest, Question, StepFormProps } from '~/app/utils/shared-types'
import { useRsvpForm, useUpdateRsvpForm } from '~/components/contexts/rsvp-form-context'
import {
  type AnswerWithType,
  findExistingAnswer,
  removeAnswer,
  upsertAnswer,
} from '~/components/website/forms/rsvp-state'

interface QuestionShortAnswerProps extends StepFormProps {
  guest?: Guest
  question: Question
}

export default function QuestionShortAnswer({
  goNext,
  goBack,
  guest,
  question,
}: QuestionShortAnswerProps) {
  const rsvpFormData = useRsvpForm()
  const updateRsvpForm = useUpdateRsvpForm()
  const questionId = question.id ?? '-1'
  // General/website questions are asked once for the whole household and have no
  // specific guest. Attribute them to the household's primary contact (falling
  // back to any household guest) so the answer references a real Guest and
  // satisfies the Answer_guestId foreign key.
  const householdGuestId =
    rsvpFormData.selectedHousehold?.primaryContact?.id ??
    rsvpFormData.selectedHousehold?.guests?.[0]?.id
  const answerTarget = {
    questionId,
    guestId: guest?.id ?? householdGuestId,
    householdId: rsvpFormData.selectedHousehold?.id,
  }
  const existingAnswer = findExistingAnswer(rsvpFormData.answersToQuestions, answerTarget)
  const [answer, setAnswer] = useState(existingAnswer?.response ?? '')

  return (
    <div className='flex flex-col gap-5'>
      <h2 className='text-2xl tracking-widest'>{question.text}</h2>
      {!!guest && (
        <span>
          {guest.firstName} {guest.lastName}
        </span>
      )}
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        className='h-40 border p-3'
      />
      <button
        className={`mt-3 bg-stone-400 py-3 text-white text-xl tracking-wide ${answer.length === 0 ? 'cursor-not-allowed bg-stone-400' : 'bg-stone-700'}`}
        type='button'
        disabled={answer.length === 0}
        onClick={() => {
          const nextAnswer: AnswerWithType = {
            ...answerTarget,
            questionType: 'Text',
            response: answer,
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
