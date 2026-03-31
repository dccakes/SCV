import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface OtpEmailProps {
  otp: string
  type: 'sign-in' | 'email-verification' | 'forget-password'
}

const subjectMap = {
  'sign-in': 'Your sign-in code',
  'email-verification': 'Verify your email',
  'forget-password': 'Reset your password',
}

export function OtpEmail({ otp, type }: OtpEmailProps) {
  const subject = subjectMap[type]

  return (
    <Html>
      <Head />
      <Preview>
        {subject}: {otp}
      </Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '480px', margin: '0 auto', padding: '40px 20px' }}>
          <Heading style={{ fontSize: '24px', color: '#111827' }}>{subject}</Heading>
          <Text style={{ color: '#6b7280', fontSize: '16px' }}>
            Use the code below to continue. It expires in 10 minutes.
          </Text>
          <Section
            style={{
              background: '#f3f4f6',
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <Text
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                letterSpacing: '8px',
                color: '#111827',
                margin: '0',
              }}
            >
              {otp}
            </Text>
          </Section>
          <Text style={{ color: '#9ca3af', fontSize: '14px', marginTop: '24px' }}>
            If you didn&apos;t request this, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
