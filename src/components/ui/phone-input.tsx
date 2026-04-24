'use client'

import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { ChevronDown } from 'lucide-react'
import * as React from 'react'
import { type Country, getCountries, getCountryCallingCode } from 'react-phone-number-input'
import ReactPhoneNumberInput from 'react-phone-number-input/input'

import { Input } from '~/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
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
  hasError?: boolean
}

type CountryOption = {
  code: Country
  callingCode: string
  label: string
}

const countryDisplayNames =
  typeof Intl !== 'undefined'
    ? new Intl.DisplayNames(['en'], {
        type: 'region',
      })
    : null

const countryOptions: CountryOption[] = getCountries().map((code) => ({
  code,
  callingCode: `+${getCountryCallingCode(code)}`,
  label: countryDisplayNames?.of(code) ?? code,
}))

const getFlagEmoji = (country: Country) =>
  String.fromCodePoint(...country.split('').map((character) => 127397 + character.charCodeAt(0)))

const getCountryFromValue = (value: string | null | undefined) => {
  if (!value) return undefined

  const parsedNumber = parsePhoneNumberFromString(value)
  return parsedNumber?.country as Country | undefined
}

const PhoneNumberInputField = React.forwardRef<HTMLInputElement, PhoneNumberInputFieldProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <Input
        {...props}
        ref={ref}
        type='tel'
        className={cn(
          'h-full rounded-none border-0 bg-transparent px-3 shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0',
          hasError && 'border-destructive',
          className
        )}
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
    const [isCountryListOpen, setIsCountryListOpen] = React.useState(false)
    const inferredCountry = getCountryFromValue(value)
    const [selectedCountry, setSelectedCountry] = React.useState<Country>(
      inferredCountry ?? defaultCountry
    )

    React.useEffect(() => {
      setSelectedCountry(inferredCountry ?? defaultCountry)
    }, [defaultCountry, inferredCountry])

    const selectedCountryOption =
      countryOptions.find((option) => option.code === selectedCountry) ?? countryOptions[0]

    const handleCountryChange = (nextCountry: Country) => {
      setSelectedCountry(nextCountry)
      setIsCountryListOpen(false)

      if (!value) return

      const parsedNumber = parsePhoneNumberFromString(value)
      if (!parsedNumber?.nationalNumber) return

      onChange(`+${getCountryCallingCode(nextCountry)}${parsedNumber.nationalNumber}`)
    }

    return (
      <div
        className={cn(
          'flex h-10 w-full items-stretch overflow-hidden rounded-[4px] border border-input bg-background ring-offset-background transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          error && 'border-destructive',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
      >
        <Popover open={isCountryListOpen} onOpenChange={setIsCountryListOpen}>
          <PopoverTrigger asChild>
            <button
              type='button'
              aria-label='Select country'
              disabled={disabled}
              className='flex shrink-0 items-center gap-2 border-border border-r bg-muted/30 px-2.5 font-sans text-foreground text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none disabled:cursor-not-allowed'
            >
              <span
                aria-hidden='true'
                className='flex h-4 w-4 items-center justify-center overflow-hidden rounded-full text-[0.95rem] leading-none'
              >
                {getFlagEmoji(selectedCountryOption.code)}
              </span>
              <span className='font-medium tabular-nums'>{selectedCountryOption.callingCode}</span>
              <ChevronDown className='h-3.5 w-3.5 text-muted-foreground' />
            </button>
          </PopoverTrigger>
          <PopoverContent align='start' className='w-[22rem] p-1'>
            <div className='max-h-72 overflow-y-auto'>
              {countryOptions.map((option) => {
                const isSelected = option.code === selectedCountry

                return (
                  <button
                    key={option.code}
                    type='button'
                    onClick={() => handleCountryChange(option.code)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-[6px] px-2.5 py-2 text-left font-sans text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                      isSelected && 'bg-accent/60 text-accent-foreground'
                    )}
                  >
                    <span
                      aria-hidden='true'
                      className='flex h-5 w-5 items-center justify-center overflow-hidden rounded-full text-base leading-none'
                    >
                      {getFlagEmoji(option.code)}
                    </span>
                    <span className='min-w-0 flex-1 truncate'>{option.label}</span>
                    <span className='shrink-0 text-foreground/65 tabular-nums'>
                      {option.callingCode}
                    </span>
                  </button>
                )
              })}
            </div>
          </PopoverContent>
        </Popover>

        <ReactPhoneNumberInput
          ref={ref}
          value={value ?? undefined}
          onChange={onChange}
          country={selectedCountry}
          international
          disabled={disabled}
          inputComponent={PhoneNumberInputField}
          id={id}
          name={name}
          placeholder={placeholder}
          aria-describedby={ariaDescribedBy}
          aria-label={ariaLabel}
          hasError={error}
          className='min-w-0 flex-1'
        />
      </div>
    )
  }
)
PhoneInput.displayName = 'PhoneInput'
