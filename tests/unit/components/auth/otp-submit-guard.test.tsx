import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

import { DUPLICATE_SUBMIT_WINDOW_MS, OtpSubmitGuard } from '~/components/auth/otp-submit-guard'

/**
 * Stand-in for Better Auth UI's verification form: an OTP input that submits itself when it is
 * full (like the library's onChange) plus a visible submit button.
 */
function FakeOtpForm({
  onAutoSubmit,
  onFormSubmit,
  otpAttribute = true,
}: {
  onAutoSubmit: () => void
  onFormSubmit: () => void
  otpAttribute?: boolean
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onFormSubmit()
      }}
    >
      <input
        aria-label='code'
        maxLength={6}
        {...(otpAttribute ? { 'data-input-otp': 'true' } : {})}
        onChange={(event) => {
          if (event.target.value.length === 6) onAutoSubmit()
        }}
      />
      <button type='submit'>Verify code</button>
    </form>
  )
}

function renderForm(children?: ReactNode) {
  const onAutoSubmit = jest.fn()
  const onFormSubmit = jest.fn()
  render(
    <OtpSubmitGuard>
      {children ?? <FakeOtpForm onAutoSubmit={onAutoSubmit} onFormSubmit={onFormSubmit} />}
    </OtpSubmitGuard>
  )
  return { onAutoSubmit, onFormSubmit }
}

const type = (value: string) =>
  fireEvent.input(screen.getByLabelText('code'), { target: { value } })
const clickVerify = () => fireEvent.click(screen.getByRole('button', { name: 'Verify code' }))

describe('OtpSubmitGuard', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-03T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('drops the second submit that follows the OTP input filling up (the double submit)', () => {
    const { onAutoSubmit, onFormSubmit } = renderForm()

    type('123456')
    clickVerify()

    expect(onAutoSubmit).toHaveBeenCalledTimes(1)
    expect(onFormSubmit).not.toHaveBeenCalled()
  })

  it('never blocks the library own auto submit, which is not a DOM submit event', () => {
    const { onAutoSubmit } = renderForm()

    type('123456')

    expect(onAutoSubmit).toHaveBeenCalledTimes(1)
  })

  it('does not block a submit when the code is not complete', () => {
    const { onFormSubmit } = renderForm()

    type('12345')
    clickVerify()

    expect(onFormSubmit).toHaveBeenCalledTimes(1)
  })

  it('does not block a submit when nothing was typed', () => {
    const { onFormSubmit } = renderForm()

    clickVerify()

    expect(onFormSubmit).toHaveBeenCalledTimes(1)
  })

  it('lets a submit through again once the window has passed', () => {
    const { onFormSubmit } = renderForm()

    type('123456')
    jest.advanceTimersByTime(DUPLICATE_SUBMIT_WINDOW_MS + 1)
    clickVerify()

    expect(onFormSubmit).toHaveBeenCalledTimes(1)
  })

  it('still drops a duplicate just inside the window', () => {
    const { onFormSubmit } = renderForm()

    type('123456')
    jest.advanceTimersByTime(DUPLICATE_SUBMIT_WINDOW_MS - 1)
    clickVerify()

    expect(onFormSubmit).not.toHaveBeenCalled()
  })

  it('protects a retry after a wrong code the same way (the window restarts)', () => {
    const { onAutoSubmit, onFormSubmit } = renderForm()

    type('111111')
    jest.advanceTimersByTime(5_000)
    type('222222')
    clickVerify()

    expect(onAutoSubmit).toHaveBeenCalledTimes(2)
    expect(onFormSubmit).not.toHaveBeenCalled()
  })

  it('ignores inputs that are not the OTP field', () => {
    const onFormSubmit = jest.fn()
    render(
      <OtpSubmitGuard>
        <FakeOtpForm onAutoSubmit={jest.fn()} onFormSubmit={onFormSubmit} otpAttribute={false} />
      </OtpSubmitGuard>
    )

    type('123456')
    clickVerify()

    // No data-input-otp attribute, so nothing was recorded and the submit goes through.
    expect(onFormSubmit).toHaveBeenCalledTimes(1)
  })
})
