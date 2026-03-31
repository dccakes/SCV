import 'server-only'

import { render } from '@react-email/render'
import { Resend } from 'resend'

import { OtpEmail } from '~/emails/otp-email'
import { env } from '~/env'

const resend = new Resend(env.RESEND_API_KEY)

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

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: subjects[type],
    html,
  })
}
