import { type Dispatch, type SetStateAction } from 'react'
import { AiOutlinePlusCircle } from 'react-icons/ai'

import QuestionOption from '~/app/_components/forms/rsvp/question-option'
import { sharedStyles } from '~/app/utils/shared-styles'
import { type TQuestionOption } from '~/app/utils/shared-types'

type QuestionOptionsFormProps = {
  questionOptions: TQuestionOption[]
  setQuestionOptions: Dispatch<SetStateAction<TQuestionOption[]>>
  setDeletedOptions: Dispatch<SetStateAction<string[]>>
}

export default function QuestionOptionsForm({
  questionOptions,
  setQuestionOptions,
  setDeletedOptions,
}: QuestionOptionsFormProps) {
  return (
    <div className="px-5">
      {questionOptions.map((option, i) => {
        return (
          <QuestionOption
            key={i}
            option={option}
            setQuestionOptions={setQuestionOptions}
            optionIndex={i}
            setDeletedOptions={setDeletedOptions}
          />
        )
      })}
      <div
        className="flex cursor-pointer gap-2"
        onClick={() =>
          setQuestionOptions((prev) => [
            ...prev,
            {
              text: '',
              description: '',
            },
          ])
        }
      >
        <AiOutlinePlusCircle size={25} color={sharedStyles.primaryColorHex} />
        <span className={`text-${sharedStyles.primaryColor}`}>Add Another Option</span>
      </div>
    </div>
  )
}
