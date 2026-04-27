import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'

import { PhoneInput } from '~/components/ui/phone-input'

jest.mock('react-phone-number-input', () => ({
  __esModule: true,
  getCountries: () => ['US', 'GB'],
  getCountryCallingCode: (country: string) => {
    if (country === 'GB') return '44'
    return '1'
  },
}))

jest.mock('react-phone-number-input/input', () => {
  const React = require('react')

  type MockProps = {
    value?: string
    onChange?: (value?: string) => void
    disabled?: boolean
    inputComponent?: React.ElementType
    international?: boolean
    hasError?: boolean
    [key: string]: unknown
  }

  const MockPhoneNumberInput = React.forwardRef<HTMLInputElement, MockProps>((props, ref) => {
    const {
      value,
      onChange,
      disabled,
      inputComponent: InputComponent,
      international: _international,
      ...rest
    } = props
    const Input = InputComponent ?? 'input'

    return (
      <Input
        {...rest}
        ref={ref}
        type='tel'
        disabled={disabled}
        value={value ?? ''}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          onChange?.(event.target.value || undefined)
        }
      />
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

  it('shows the selected country calling code in the trigger', () => {
    render(<PhoneInput value={undefined} onChange={jest.fn()} defaultCountry='GB' />)

    expect(screen.getByRole('button', { name: 'Select country' })).toHaveTextContent('+44')
  })

  it('applies destructive border class when error=true', () => {
    render(<PhoneInput value={undefined} onChange={jest.fn()} error />)

    expect(screen.getByRole('textbox').className).toContain('border-destructive')
  })

  it('is disabled when disabled=true', () => {
    render(<PhoneInput value={undefined} onChange={jest.fn()} disabled />)

    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Select country' })).toBeDisabled()
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

  it('forwards name attribute to the input', () => {
    render(<PhoneInput value={undefined} onChange={jest.fn()} name='phone' />)

    expect(screen.getByRole('textbox')).toHaveAttribute('name', 'phone')
  })

  it('does not leak numberInputProps to the DOM', () => {
    render(<PhoneInput value={undefined} onChange={jest.fn()} />)

    expect(screen.getByRole('textbox')).not.toHaveAttribute('numberinputprops')
  })

  it('renders a scrollable, viewport-safe country list', () => {
    render(<PhoneInput value={undefined} onChange={jest.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Select country' }))

    const countryList = screen.getByRole('listbox', { name: 'Country codes' })
    expect(countryList.className).toContain('overflow-y-auto')
    expect(countryList.className).toContain('overscroll-contain')
    expect(countryList.className).toContain('touch-pan-y')
    expect(countryList.parentElement?.className).toContain('max-w-[calc(100vw-24px)]')
  })
})
