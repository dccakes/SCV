import { type Dispatch, type SetStateAction } from 'react'
import { FiMinusCircle } from 'react-icons/fi'

import AnimatedInputLabel from '~/app/_components/forms/animated-input-label'
import { type TQuestionOption } from '~/app/utils/shared-types'

type QuestionOptionProps = {
  option: TQuestionOption
  setQuestionOptions: Dispatch<SetStateAction<TQuestionOption[]>>
  optionIndex: number
  setDeletedOptions: Dispatch<SetStateAction<string[]>>
}

export default function QuestionOption({
  option,
  setQuestionOptions,
  optionIndex,
  setDeletedOptions,
}: QuestionOptionProps) {
  const handleRemoveOption = (option: TQuestionOption) => {
    setQuestionOptions((prev) => prev.filter((_, i) => i !== optionIndex))
    if (option.id) setDeletedOptions((prev) => [...prev, option.id!])
  }

  const handleOnChange = ({ field, inputValue }: { field: string; inputValue: string }) => {
    setQuestionOptions((prev) => {
      return prev.map((prevOption, i) => {
        if (i === optionIndex) {
          return {
            ...prevOption,
            [field]: inputValue,
          }
        }
        return prevOption
      })
    })
  }

  return (
    <div className="flex w-full pb-5 pt-2">
      <FiMinusCircle
        size={32}
        color={optionIndex < 2 ? 'lightgray' : 'gray'}
        className={`-ml-0.5 mr-3 mt-2 ${optionIndex < 2 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => optionIndex > 1 && handleRemoveOption(option)}
      />
      <div className="flex w-full flex-col gap-3">
        <AnimatedInputLabel
          id="question-input"
          inputValue={option.text}
          fieldName="text"
          labelText="Option*"
          required={true}
          handleOnChange={handleOnChange}
        />
        <textarea
          placeholder="Description"
          value={option.description}
          onChange={(e) => handleOnChange({ field: 'description', inputValue: e.target.value })}
          className="h-24 w-full rounded-lg border p-3 text-sm"
          style={{ resize: 'none' }}
        />
      </div>
    </div>
  )
}
