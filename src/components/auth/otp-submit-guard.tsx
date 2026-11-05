'use client'

import { type FormEvent, type ReactNode, useRef } from 'react'

/**
 * How long after an OTP input becomes full a submit is treated as a duplicate. Long enough to
 * cover a slow double tap or Enter, short enough that a retry after a wrong code (which needs the
 * response plus a fresh 6 digits) is never swallowed.
 */
export const DUPLICATE_SUBMIT_WINDOW_MS = 1500

type OtpInputState = { full: boolean; filledAt: number }

const OTP_INPUT_SELECTOR = 'input[data-input-otp]'

/**
 * Better Auth UI's OTP form submits itself the moment the 6th digit is entered, and its visible
 * "Verify code" button and the Enter key submit it a second time. Two overlapping submissions
 * leave the form's submitting state stuck, so the code field and the button stay disabled until
 * the page is reloaded (reproduced in a real browser). The library has no option to prevent this,
 * so this guard records when an OTP input becomes full and drops any submit event from the same
 * form within the window, before the library's form handler sees it. The auto submit is not a DOM
 * submit event, so it is never blocked.
 *
 * Only the transition to full is recorded. `input-otp` also dispatches synthetic `input` events
 * whenever the field gains or loses focus, even though the value did not change, so clicking
 * "Verify" (which blurs the field) must not restart the window. It depends on `input-otp`'s
 * `data-input-otp` attribute; if a library update removes it, the guard silently stops working
 * and the stuck state would return.
 */
export function OtpSubmitGuard({ children }: { children: ReactNode }) {
  const inputStates = useRef(new WeakMap<HTMLInputElement, OtpInputState>())

  const noteOtpInput = (event: FormEvent<HTMLDivElement>) => {
    const input = event.target
    if (!(input instanceof HTMLInputElement) || !input.hasAttribute('data-input-otp')) return
    if (input.maxLength <= 0) return

    const full = input.value.length >= input.maxLength
    const previous = inputStates.current.get(input)
    if (full && !previous?.full) {
      inputStates.current.set(input, { full: true, filledAt: performance.now() })
    } else if (!full && previous?.full) {
      inputStates.current.set(input, { full: false, filledAt: previous.filledAt })
    }
  }

  const dropDuplicateSubmit = (event: FormEvent<HTMLDivElement>) => {
    const form = event.target
    if (!(form instanceof HTMLElement)) return

    const input = form.querySelector<HTMLInputElement>(OTP_INPUT_SELECTOR)
    const state = input ? inputStates.current.get(input) : undefined
    if (state && performance.now() - state.filledAt < DUPLICATE_SUBMIT_WINDOW_MS) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  return (
    <div onInputCapture={noteOtpInput} onSubmitCapture={dropDuplicateSubmit}>
      {children}
    </div>
  )
}
