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
jest.mock('~/emails/otp-email', () => ({
  OtpEmail: function OtpEmail(_props: Record<string, unknown>) {
    return null
  },
}))
jest.mock('~/emails/reset-password-email', () => ({
  ResetPasswordEmail: function ResetPasswordEmail(_props: Record<string, unknown>) {
    return null
  },
}))
jest.mock('~/emails/organization-invitation-email', () => ({
  OrganizationInvitationEmail: function OrganizationInvitationEmail(
    _props: Record<string, unknown>
  ) {
    return null
  },
}))
jest.mock('~/env', () => ({
  env: { RESEND_API_KEY: 're_test_key', EMAIL_FROM: 'test@example.com' },
}))

import { OrganizationInvitationEmail } from '~/emails/organization-invitation-email'
import { OtpEmail } from '~/emails/otp-email'
import { ResetPasswordEmail } from '~/emails/reset-password-email'
import { sendOrganizationInvitationEmail, sendOtpEmail, sendResetPasswordEmail } from '~/lib/email'

beforeEach(() => {
  mockEmailsSend.mockClear()
  mockRender.mockClear()
})

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

describe('sendResetPasswordEmail', () => {
  const TO = 'user@example.com'
  const URL = 'https://example.com/reset?token=abc'

  it('sends with correct subject, to, and from', async () => {
    await sendResetPasswordEmail({ to: TO, url: URL })

    expect(mockEmailsSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Reset your password', to: TO, from: 'test@example.com' })
    )
  })

  it('renders ResetPasswordEmail with the url', async () => {
    await sendResetPasswordEmail({ to: TO, url: URL })

    const element = mockRender.mock.calls[0][0]
    expect(element.type).toBe(ResetPasswordEmail)
    expect(element.props).toMatchObject({ url: URL })
  })

  it('passes userName to the template when provided', async () => {
    await sendResetPasswordEmail({ to: TO, url: URL, userName: 'Shrek' })

    const element = mockRender.mock.calls[0][0]
    expect(element.props).toMatchObject({ userName: 'Shrek' })
  })

  it('passes undefined userName when omitted', async () => {
    await sendResetPasswordEmail({ to: TO, url: URL })

    expect(mockRender.mock.calls[0][0].props.userName).toBeUndefined()
  })
})

describe('sendOrganizationInvitationEmail', () => {
  const TO = 'planner@example.com'
  const INVITE_URL = 'https://example.com/auth/accept-invitation?invitationId=inv_123'

  it('sends with the organization invitation subject', async () => {
    await sendOrganizationInvitationEmail({
      to: TO,
      inviteUrl: INVITE_URL,
      organizationName: 'Shrek & Fiona',
      invitedByName: 'Fiona',
      memberRole: 'member',
    })

    expect(mockEmailsSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "You've been invited to join Shrek & Fiona on OSWP",
        to: TO,
        from: 'test@example.com',
      })
    )
  })

  it('renders OrganizationInvitationEmail with the invite details', async () => {
    await sendOrganizationInvitationEmail({
      to: TO,
      inviteUrl: INVITE_URL,
      organizationName: 'Shrek & Fiona',
      invitedByName: 'Fiona',
      memberRole: 'viewer',
    })

    const element = mockRender.mock.calls[0][0]
    expect(element.type).toBe(OrganizationInvitationEmail)
    expect(element.props).toMatchObject({
      inviteUrl: INVITE_URL,
      organizationName: 'Shrek & Fiona',
      invitedByName: 'Fiona',
      memberRole: 'viewer',
    })
  })
})
