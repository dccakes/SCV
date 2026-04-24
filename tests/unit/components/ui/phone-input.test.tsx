import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'

import { PhoneInput } from '~/components/ui/phone-input'

jest.mock('react-phone-number-input', () => {
  const React = require('react')

  type MockProps = {
    value?: string
    onChange?: (value?: string) => void
    disabled?: boolean
    className?: string
    inputComponent?: React.ElementType
    numberInputProps?: {
      forwardedRef?: React.Ref<HTMLInputElement>
      [key: string]: unknown
    }
    [key: string]: unknown
  }

  const MockPhoneNumberInput = React.forwardRef<HTMLInputElement, MockProps>((props, ref) => {
    const {
      value,
      onChange,
      disabled,
      className,
      inputComponent: InputComponent,
      numberInputProps,
      ...rest
    } = props
    const Input = InputComponent ?? 'input'
    const mergedRef = numberInputProps?.forwardedRef ?? ref

    return (
      <div>
        <button type='button' aria-label='Select country'>
          +1
        </button>
        <Input
          {...rest}
          {...numberInputProps}
          ref={mergedRef}
          type='tel'
          disabled={disabled}
          className={className}
          value={value ?? ''}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            onChange?.(event.target.value || undefined)
          }
        />
      </div>
    )
  })

  MockPhoneNumberInput.displayName = 'MockPhoneNumberInput'

  return {
    __esModule: true,
    default: MockPhoneNumberInput,
  }
})

describe('PhoneInput', () => {
  it('renders a textbox', () => {
    render(<PhoneInput value={undefined} onChange={jest.fn()} />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('applies destructive border class when error=true', () => {
    render(<PhoneInput value={undefined} onChange={jest.fn()} error />)

    expect(screen.getByRole('textbox').className).toContain('border-destructive')
  })

  it('is disabled when disabled=true', () => {
    render(<PhoneInput value={undefined} onChange={jest.fn()} disabled />)

    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('calls onChange with E.164 values', () => {
    const onChange = jest.fn()
    render(<PhoneInput value={undefined} onChange={onChange} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '+12025550123' } })

    expect(onChange).toHaveBeenCalledWith('+12025550123')
  })

  it('calls onChange(undefined) when cleared', () => {
    const onChange = jest.fn()
    render(<PhoneInput value='+12025550123' onChange={onChange} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } })

    expect(onChange).toHaveBeenCalledWith(undefined)
  })

  it('forwards ref to the HTMLInputElement', () => {
    const ref = createRef<HTMLInputElement>()
    render(<PhoneInput ref={ref} value={undefined} onChange={jest.fn()} />)

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('renders country selector button', () => {
    render(<PhoneInput value={undefined} onChange={jest.fn()} />)

    expect(screen.getByRole('button', { name: 'Select country' })).toBeInTheDocument()
  })
})
