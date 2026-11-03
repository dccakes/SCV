'use client'

import { type FormEvent, type ReactNode, useRef } from 'react'

/**
 * How long after an OTP input fills up a second submit is treated as a duplicate. Long enough to
 * cover a slow double tap or Enter, short enough that a retry after a wrong code (which needs the
 * response plus a fresh 6 digits) is never swallowed.
 */
export const DUPLICATE_SUBMIT_WINDOW_MS = 1500

/**
 * Better Auth UI's OTP form submits itself the moment the 6th digit is entered, and its visible
 * "Verify code" button and the Enter key submit it again. Two overlapping submissions leave the
 * form's submitting state stuck, so the code field and the button stay disabled until the page is
 * reloaded (reproduced in a real browser). The library has no option to prevent this, so this
 * guard records when an OTP input fills up and drops any submit event that follows within the
 * window, before the library's form handler sees it. The auto submit is not a DOM submit event,
 * so it is never blocked.
 */
export function OtpSubmitGuard({ children }: { children: ReactNode }) {
  const otpFilledAt = useRef<number | null>(null)

  const noteFilledOtpInput = (event: FormEvent<HTMLDivElement>) => {
    const input = event.target
    if (
      input instanceof HTMLInputElement &&
      input.hasAttribute('data-input-otp') &&
      input.maxLength > 0 &&
      input.value.length >= input.maxLength
    ) {
      otpFilledAt.current = Date.now()
    }
  }

  const dropDuplicateSubmit = (event: FormEvent<HTMLDivElement>) => {
    const filledAt = otpFilledAt.current
    if (filledAt !== null && Date.now() - filledAt < DUPLICATE_SUBMIT_WINDOW_MS) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  return (
    <div onInputCapture={noteFilledOtpInput} onSubmitCapture={dropDuplicateSubmit}>
      {children}
    </div>
  )
}
