import { Body, Button, Container, Head, Heading, Preview, Text } from '@react-email/components'

import { emailStyles } from '~/emails/email-styles'

interface ResetPasswordEmailProps {
  url: string
  userName?: string
}

export function ResetPasswordEmail({ url, userName }: ResetPasswordEmailProps) {
  return (
    <html lang='en'>
      <Head />
      <Preview>Reset your password</Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <Heading style={emailStyles.heading}>Reset your password</Heading>
          <Text style={emailStyles.bodyText}>
            {userName ? `Hi ${userName}, c` : 'C'}lick the button below to reset your password. The
            link expires in 1 hour.
          </Text>
          <Button
            href={url}
            style={{
              background: '#111827',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '6px',
              fontWeight: 'bold',
              display: 'inline-block',
            }}
          >
            Reset Password
          </Button>
          <Text style={emailStyles.footerText}>
            If you didn&apos;t request this, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </html>
  )
}
