import 'server-only'

import { render } from '@react-email/render'
import { Resend } from 'resend'

import { OtpEmail } from '~/emails/otp-email'
import { ResetPasswordEmail } from '~/emails/reset-password-email'
import { env } from '~/env'

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(env.RESEND_API_KEY)
  }
  return _resend
}

export async function sendOtpEmail({
  to,
  otp,
  type,
}: {
  to: string
  otp: string
  type: 'sign-in' | 'email-verification' | 'forget-password' | 'change-email'
}) {
  const subjects: Record<typeof type, string> = {
    'sign-in': 'Your sign-in code',
    'email-verification': 'Verify your email',
    'forget-password': 'Reset your password',
    'change-email': 'Confirm your new email',
  }

  // Map change-email to email-verification for the template
  const templateType = type === 'change-email' ? 'email-verification' : type

  const html = await render(<OtpEmail otp={otp} type={templateType} />)

  await getResend().emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: subjects[type],
    html,
  })
}

export async function sendResetPasswordEmail({
  to,
  url,
  userName,
}: {
  to: string
  url: string
  userName?: string
}) {
  const html = await render(<ResetPasswordEmail url={url} userName={userName} />)

  await getResend().emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: 'Reset your password',
    html,
  })
}
