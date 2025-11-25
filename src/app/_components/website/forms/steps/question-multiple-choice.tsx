'use client'

import { useState } from 'react'
import { IoIosCheckmarkCircleOutline } from 'react-icons/io'

import { useRsvpForm, useUpdateRsvpForm } from '~/app/_components/contexts/rsvp-form-context'
import { type Guest, type Question, type StepFormProps } from '~/app/utils/shared-types'

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
  const rsvpFormData = useRsvpForm()
  const updateRsvpForm = useUpdateRsvpForm()
  const [selectedOptionId, setSelectedOptionId] = useState<string | undefined>()

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-2xl tracking-widest">{question.text}</h2>
      {!!guest && (
        <span>
          {guest.firstName} {guest.lastName}
        </span>
      )}
      <ul>
        {question.options?.map((option) => {
          return (
            <li
              key={option.id}
              onClick={() => setSelectedOptionId(option.id)}
              className={`relative mb-3 cursor-pointer rounded-lg border border-gray-700 p-5 hover:bg-gray-700 hover:text-white ${selectedOptionId === option.id && 'bg-gray-700 text-white'}`}
            >
              <div className="flex flex-col gap-3">
                <h3>{option.text}</h3>
                <p>{option.description}</p>
              </div>
              {selectedOptionId === option.id && (
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                  <IoIosCheckmarkCircleOutline size={20} />
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <button
        className={`mt-3 bg-stone-400 py-3 text-xl tracking-wide text-white ${selectedOptionId === undefined ? 'cursor-not-allowed bg-stone-400' : 'bg-stone-700'}`}
        type="button"
        disabled={selectedOptionId === undefined}
        onClick={() => {
          updateRsvpForm({
            answersToQuestions: [
              ...rsvpFormData.answersToQuestions,
              {
                questionId: question.id ?? '-1',
                questionType: 'Option',
                response: selectedOptionId!,
                guestId: guest?.id,
                householdId: rsvpFormData.selectedHousehold?.id,
                guestFirstName:
                  guest?.firstName ?? rsvpFormData.selectedHousehold?.primaryContact?.firstName,
                guestLastName:
                  guest?.lastName ?? rsvpFormData.selectedHousehold?.primaryContact?.lastName,
              },
            ],
          })
          goNext?.()
        }}
      >
        CONTINUE
      </button>
      {!question.isRequired && (
        <button
          className={`mt-3 bg-gray-700 py-3 text-xl tracking-wide text-white`}
          type="button"
          onClick={() => goNext?.()}
        >
          SKIP
        </button>
      )}
      <button
        className={`mt-3 bg-gray-700 py-3 text-xl tracking-wide text-white`}
        type="submit"
        onClick={() => goBack?.()}
      >
        BACK
      </button>
    </div>
  )
}
