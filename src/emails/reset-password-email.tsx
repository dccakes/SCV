import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'

interface ResetPasswordEmailProps {
  url: string
  userName?: string
}

export function ResetPasswordEmail({ url, userName }: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '480px', margin: '0 auto', padding: '40px 20px' }}>
          <Heading style={{ fontSize: '24px', color: '#111827' }}>Reset your password</Heading>
          <Text style={{ color: '#6b7280', fontSize: '16px' }}>
            {userName ? `Hi ${userName}, c` : 'C'}lick the button below to reset your password.
            The link expires in 1 hour.
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
          <Text style={{ color: '#9ca3af', fontSize: '14px', marginTop: '24px' }}>
            If you didn&apos;t request this, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
