import { act, fireEvent, render, screen } from '@testing-library/react'
import { OTPInput } from 'input-otp'
import { useState } from 'react'

import { DUPLICATE_SUBMIT_WINDOW_MS, OtpSubmitGuard } from '~/components/auth/otp-submit-guard'

/**
 * Uses the REAL `input-otp` component Better Auth UI is built on, not a stand-in. That matters:
 * `input-otp` dispatches synthetic `input` events whenever the value changes AND whenever the
 * field gains or loses focus, which the guard must not mistake for the code being completed.
 */
function RealOtpForm({
  onFormSubmit,
  onCodeChange,
}: {
  onFormSubmit: () => void
  onCodeChange?: (value: string) => void
}) {
  const [value, setValue] = useState('')
  return (
    <form
      aria-label='verify'
      onSubmit={(event) => {
        event.preventDefault()
        onFormSubmit()
      }}
    >
      <OTPInput
        aria-label='code'
        maxLength={6}
        value={value}
        onChange={(next) => {
          setValue(next)
          onCodeChange?.(next)
        }}
        render={({ slots }) => (
          <div>
            {slots.map((slot, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed length slots
              <span key={index}>{slot.char}</span>
            ))}
          </div>
        )}
      />
      <button type='submit'>Verify code</button>
    </form>
  )
}

const otpInput = () => screen.getByLabelText('code')
const typeCode = (value: string) => fireEvent.input(otpInput(), { target: { value } })
const clickVerify = () => fireEvent.click(screen.getByRole('button', { name: 'Verify code' }))
const advance = (ms: number) => act(() => void jest.advanceTimersByTime(ms))

function renderGuarded(extra?: React.ReactNode) {
  const onFormSubmit = jest.fn()
  const onCodeChange = jest.fn()
  render(
    <OtpSubmitGuard>
      <RealOtpForm onFormSubmit={onFormSubmit} onCodeChange={onCodeChange} />
      {extra}
    </OtpSubmitGuard>
  )
  return { onFormSubmit, onCodeChange }
}

describe('OtpSubmitGuard with the real input-otp component', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('drops the click that follows the library auto submitting on the 6th digit', () => {
    const { onFormSubmit, onCodeChange } = renderGuarded()

    typeCode('123456')
    advance(60) // flush input-otp's own synthetic input events
    clickVerify()

    expect(onCodeChange).toHaveBeenCalledWith('123456')
    expect(onFormSubmit).not.toHaveBeenCalled()
  })

  it('never blocks the library own onChange (the auto submit path)', () => {
    const { onCodeChange } = renderGuarded()

    typeCode('123456')

    expect(onCodeChange).toHaveBeenCalledTimes(1)
  })

  it('does not block a submit while the code is incomplete', () => {
    const { onFormSubmit } = renderGuarded()

    typeCode('12345')
    advance(60)
    clickVerify()

    expect(onFormSubmit).toHaveBeenCalledTimes(1)
  })

  it('does NOT restart the window when the field is focused or blurred with a full code', () => {
    // Regression: clicking "Verify" blurs the field, and input-otp answers focus changes with
    // synthetic input events. Those must not count as the code being completed again.
    const { onFormSubmit } = renderGuarded()

    typeCode('123456')
    advance(DUPLICATE_SUBMIT_WINDOW_MS - 100)
    fireEvent.focus(otpInput())
    fireEvent.blur(otpInput())
    advance(100 + 600) // 600ms after the blur, past the window measured from the fill
    clickVerify()

    expect(onFormSubmit).toHaveBeenCalledTimes(1)
  })

  it('ignores a bare input event on an already-full field', () => {
    const { onFormSubmit } = renderGuarded()

    typeCode('123456')
    advance(DUPLICATE_SUBMIT_WINDOW_MS - 100)
    fireEvent.input(otpInput())
    advance(600)
    clickVerify()

    expect(onFormSubmit).toHaveBeenCalledTimes(1)
  })

  it('starts a new window when the code is cleared and completed again (retry after wrong)', () => {
    const { onFormSubmit } = renderGuarded()

    typeCode('111111')
    advance(5_000)
    typeCode('')
    advance(60)
    typeCode('222222')
    advance(60)
    clickVerify()

    expect(onFormSubmit).not.toHaveBeenCalled()
  })

  it('lets a submit through exactly when the window has elapsed', () => {
    const { onFormSubmit } = renderGuarded()

    typeCode('123456')
    advance(DUPLICATE_SUBMIT_WINDOW_MS)
    clickVerify()

    expect(onFormSubmit).toHaveBeenCalledTimes(1)
  })

  it('still drops a duplicate one millisecond inside the window', () => {
    const { onFormSubmit } = renderGuarded()

    typeCode('123456')
    advance(DUPLICATE_SUBMIT_WINDOW_MS - 1)
    clickVerify()

    expect(onFormSubmit).not.toHaveBeenCalled()
  })

  it('does not affect a different form on the same page', () => {
    const otherSubmit = jest.fn()
    const { onFormSubmit } = renderGuarded(
      <form
        aria-label='other'
        onSubmit={(event) => {
          event.preventDefault()
          otherSubmit()
        }}
      >
        <button type='submit'>Save profile</button>
      </form>
    )

    typeCode('123456')
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }))

    expect(otherSubmit).toHaveBeenCalledTimes(1)
    expect(onFormSubmit).not.toHaveBeenCalled()
  })

  it('ignores an input marked data-input-otp that has no maxLength', () => {
    const onFormSubmit = jest.fn()
    render(
      <OtpSubmitGuard>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onFormSubmit()
          }}
        >
          <input aria-label='loose' data-input-otp='true' />
          <button type='submit'>Go</button>
        </form>
      </OtpSubmitGuard>
    )

    fireEvent.input(screen.getByLabelText('loose'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))

    expect(onFormSubmit).toHaveBeenCalledTimes(1)
  })

  it('ignores inputs that are not an OTP field', () => {
    const onFormSubmit = jest.fn()
    render(
      <OtpSubmitGuard>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onFormSubmit()
          }}
        >
          <input aria-label='plain' maxLength={6} />
          <button type='submit'>Go</button>
        </form>
      </OtpSubmitGuard>
    )

    fireEvent.input(screen.getByLabelText('plain'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))

    expect(onFormSubmit).toHaveBeenCalledTimes(1)
  })
})
