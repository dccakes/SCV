import { Body, Container, Head, Heading, Preview, Section, Text } from '@react-email/components'

import { emailStyles } from '~/emails/email-styles'

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
    <html lang='en'>
      <Head />
      <Preview>
        {subject}: {otp}
      </Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <Heading style={emailStyles.heading}>{subject}</Heading>
          <Text style={emailStyles.bodyText}>
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
          <Text style={emailStyles.footerText}>
            If you didn&apos;t request this, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </html>
  )
}
