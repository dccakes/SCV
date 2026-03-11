import type { Dispatch, SetStateAction } from 'react'
import { AiOutlinePlusCircle } from 'react-icons/ai'
import { sharedStyles } from '~/app/utils/shared-styles'
import type { TQuestionOption } from '~/app/utils/shared-types'
import QuestionOption from '~/components/forms/rsvp/question-option'

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
    <div className='px-5'>
      {questionOptions.map((option, i) => {
        return (
          <QuestionOption
            key={
              'id' in option && option.id ? option.id : `${option.text}-${option.description}-${i}`
            }
            option={option}
            setQuestionOptions={setQuestionOptions}
            optionIndex={i}
            setDeletedOptions={setDeletedOptions}
          />
        )
      })}
      <button
        type='button'
        className='flex cursor-pointer gap-2'
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
      </button>
    </div>
  )
}
