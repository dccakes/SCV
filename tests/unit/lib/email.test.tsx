// `var` + factory-assignment pattern required: jest.mock factories are hoisted before
// const/let initializers, so we assign the mock functions inside the factory itself.
var mockEmailsSend: jest.Mock
var mockRender: jest.Mock

jest.mock('server-only', () => ({}))
jest.mock('resend', () => {
  mockEmailsSend = jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null })
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: { send: mockEmailsSend },
    })),
  }
})
jest.mock('@react-email/render', () => {
  mockRender = jest.fn().mockResolvedValue('<html>rendered</html>')
  return { render: mockRender }
})
jest.mock('~/env', () => ({
  env: { RESEND_API_KEY: 're_test_key', EMAIL_FROM: 'test@example.com' },
}))

import { OtpEmail } from '~/emails/otp-email'
import { sendOtpEmail } from '~/lib/email'

describe('sendOtpEmail', () => {
  const TO = 'recipient@example.com'
  const OTP = '123456'

  it.each([
    ['sign-in', 'Your sign-in code'],
    ['email-verification', 'Verify your email'],
    ['forget-password', 'Reset your password'],
    ['change-email', 'Confirm your new email'],
  ] as const)('sends correct subject for type "%s"', async (type, expectedSubject) => {
    await sendOtpEmail({ to: TO, otp: OTP, type })

    expect(mockEmailsSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expectedSubject, to: TO, from: 'test@example.com' })
    )
  })

  it('passes the rendered html to resend', async () => {
    mockRender.mockResolvedValue('<html>otp-html</html>')

    await sendOtpEmail({ to: TO, otp: OTP, type: 'sign-in' })

    expect(mockEmailsSend).toHaveBeenCalledWith(
      expect.objectContaining({ html: '<html>otp-html</html>' })
    )
  })

  it('renders OtpEmail with the correct otp and type', async () => {
    await sendOtpEmail({ to: TO, otp: OTP, type: 'sign-in' })

    const element = mockRender.mock.calls[0][0]
    expect(element.type).toBe(OtpEmail)
    expect(element.props).toMatchObject({ otp: OTP, type: 'sign-in' })
  })

  it('maps change-email type to email-verification template prop', async () => {
    await sendOtpEmail({ to: TO, otp: OTP, type: 'change-email' })

    const element = mockRender.mock.calls[0][0]
    expect(element.type).toBe(OtpEmail)
    expect(element.props).toMatchObject({ otp: OTP, type: 'email-verification' })
  })
})
