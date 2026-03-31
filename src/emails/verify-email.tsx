import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'

interface VerifyEmailProps {
  url: string
  userName?: string
}

export function VerifyEmail({ url, userName }: VerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '480px', margin: '0 auto', padding: '40px 20px' }}>
          <Heading style={{ fontSize: '24px', color: '#111827' }}>Verify your email</Heading>
          <Text style={{ color: '#6b7280', fontSize: '16px' }}>
            {userName ? `Hi ${userName}, c` : 'C'}lick the button below to verify your email
            address.
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
            Verify Email
          </Button>
          <Text style={{ color: '#9ca3af', fontSize: '14px', marginTop: '24px' }}>
            If you didn&apos;t create an account, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
