import { sharedStyles } from '~/app/utils/shared-styles'

type AnimatedInputLabelProps = {
  id: string
  type?: string
  pattern?: string
  title?: string
  maxLength?: number
  inputValue: string
  fieldName?: string
  labelText: string
  guestIndex?: number
  required?: boolean
  handleOnChange: ({
    field,
    inputValue,
    guestIndex,
  }: {
    field: string
    inputValue: string
    guestIndex: number
  }) => void
}

export default function AnimatedInputLabel({
  id,
  type,
  pattern,
  title,
  maxLength,
  inputValue,
  fieldName,
  labelText,
  guestIndex,
  required,
  handleOnChange,
}: AnimatedInputLabelProps) {
  return (
    <div className='relative'>
      <input
        type={type ?? 'text'}
        pattern={pattern}
        title={title}
        maxLength={maxLength}
        id={id}
        placeholder=' '
        value={inputValue ?? ''}
        required={required ?? false}
        onChange={(e) =>
          handleOnChange({
            field: fieldName ?? '',
            inputValue: e.target.value,
            guestIndex: guestIndex ?? 0,
          })
        }
        className={sharedStyles.animatedInput}
      />
      <label htmlFor={id} className={sharedStyles.animatedLabel}>
        {labelText}
      </label>
    </div>
  )
}
