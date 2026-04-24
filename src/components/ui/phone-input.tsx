'use client'

import * as React from 'react'
import ReactPhoneNumberInput, { type Country } from 'react-phone-number-input'

import { Input } from '~/components/ui/input'
import { cn } from '~/lib/utils'

export type PhoneInputProps = {
  value?: string | null | undefined
  onChange: (value: string | undefined) => void
  defaultCountry?: Country
  id?: string
  name?: string
  disabled?: boolean
  placeholder?: string
  className?: string
  error?: boolean
  'aria-describedby'?: string
  'aria-label'?: string
}

type PhoneNumberInputFieldProps = React.ComponentProps<'input'> & {
  forwardedRef?: React.Ref<HTMLInputElement>
  hasError?: boolean
}

const assignRef = <T,>(ref: React.Ref<T> | undefined, value: T | null) => {
  if (!ref) return
  if (typeof ref === 'function') {
    ref(value)
    return
  }
  ;(ref as React.MutableRefObject<T | null>).current = value
}

const PhoneNumberInputField = React.forwardRef<HTMLInputElement, PhoneNumberInputFieldProps>(
  ({ className, forwardedRef, hasError, ...props }, libraryRef) => {
    const setRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        assignRef(libraryRef, node)
        assignRef(forwardedRef, node)
      },
      [forwardedRef, libraryRef]
    )

    return (
      <Input
        {...props}
        ref={setRef}
        type='tel'
        className={cn(className, hasError && 'border-destructive')}
      />
    )
  }
)
PhoneNumberInputField.displayName = 'PhoneNumberInputField'

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value,
      onChange,
      defaultCountry = 'US',
      id,
      name,
      disabled,
      placeholder,
      className,
      error,
      'aria-describedby': ariaDescribedBy,
      'aria-label': ariaLabel,
    },
    ref
  ) => {
    return (
      <ReactPhoneNumberInput
        value={value ?? undefined}
        onChange={onChange}
        defaultCountry={defaultCountry}
        international
        countryCallingCodeEditable={false}
        disabled={disabled}
        inputComponent={PhoneNumberInputField}
        numberInputProps={{
          id,
          name,
          placeholder,
          'aria-describedby': ariaDescribedBy,
          'aria-label': ariaLabel,
          forwardedRef: ref,
          hasError: error,
        }}
        className={cn(
          'flex items-center gap-2',
          '[&_.PhoneInputCountry]:shrink-0',
          '[&_.PhoneInputCountrySelect]:h-10 [&_.PhoneInputCountrySelect]:rounded-[4px] [&_.PhoneInputCountrySelect]:border [&_.PhoneInputCountrySelect]:border-input [&_.PhoneInputCountrySelect]:bg-background [&_.PhoneInputCountrySelect]:px-2 [&_.PhoneInputCountrySelect]:font-sans [&_.PhoneInputCountrySelect]:text-sm',
          '[&_.PhoneInputCountrySelectArrow]:hidden',
          error && 'border-destructive',
          className
        )}
      />
    )
  }
)
PhoneInput.displayName = 'PhoneInput'
