import { type Dispatch, type SetStateAction } from 'react'
import { AiOutlinePlusCircle } from 'react-icons/ai'
import { BsPencil } from 'react-icons/bs'

import { sharedStyles } from '~/app/utils/shared-styles'
import { type Question, type Website } from '~/app/utils/shared-types'

type GeneralQuestionsSectionProps = {
  website: Website | undefined | null
  setUseEditMode: Dispatch<SetStateAction<boolean>>
  setPrefillQuestion: Dispatch<SetStateAction<Question | undefined>>
  setShowQuestionForm: Dispatch<SetStateAction<boolean>>
}

export default function GeneralQuestionsSection({
  website,
  setUseEditMode,
  setPrefillQuestion,
  setShowQuestionForm,
}: GeneralQuestionsSectionProps) {
  if (!website) return <div>Could not load questions. Please refresh the page.</div>
  const onAddQuestion = (websiteId: string) => {
    setUseEditMode(false)
    setPrefillQuestion({
      id: '',
      websiteId,
      text: '',
      type: 'Text',
      isRequired: false,
    })
    setShowQuestionForm(true)
  }
  return (
    <div className="py-10">
      <h1 className="py-2 text-2xl font-bold">General Questions</h1>
      <p>
        These questions will be asked of all guests that RSVP, regardless of if they say
        &apos;Yes&apos; or &apos;No&apos;
      </p>
      <ul className="mt-5 flex flex-col gap-3">
        {website?.generalQuestions?.map((question) => {
          return (
            <li key={question.id} className="border-2 p-4">
              <div className="flex justify-between">
                <p>{question.text}</p>
                <BsPencil
                  size={20}
                  color={sharedStyles.primaryColorHex}
                  className="cursor-pointer"
                  onClick={() => {
                    setUseEditMode(true)
                    setPrefillQuestion(question)
                    setShowQuestionForm(true)
                  }}
                />
              </div>
            </li>
          )
        })}
      </ul>
      <div
        className="flex w-fit cursor-pointer gap-2 pt-5"
        onClick={() => onAddQuestion(website.id)}
      >
        <AiOutlinePlusCircle size={25} color={sharedStyles.primaryColorHex} />
        <span className={`text-${sharedStyles.primaryColor}`}>Add Another Question</span>
      </div>
    </div>
  )
}
