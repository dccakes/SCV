import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'

import { emailStyles } from '~/emails/email-styles'

interface OrganizationInvitationEmailProps {
  inviteUrl: string
  invitedByName?: string
  organizationName: string
  memberRole: string
}

export function OrganizationInvitationEmail({
  inviteUrl,
  invitedByName,
  organizationName,
  memberRole,
}: OrganizationInvitationEmailProps) {
  const inviterLead = invitedByName
    ? `${invitedByName} invited you to collaborate on ${organizationName}.`
    : `You've been invited to collaborate on ${organizationName}.`

  return (
    <Html>
      <Head />
      <Preview>Join {organizationName} on OSWP</Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <Heading style={emailStyles.heading}>Join this wedding workspace</Heading>
          <Text style={emailStyles.bodyText}>{inviterLead}</Text>
          <Text style={emailStyles.bodyText}>
            You&apos;ve been assigned the <strong>{memberRole}</strong> role. Accept the invitation
            to access planning, guest, and website tools for this wedding.
          </Text>
          <Button
            href={inviteUrl}
            style={{
              background: '#111827',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '6px',
              fontWeight: 'bold',
              display: 'inline-block',
            }}
          >
            Accept Invitation
          </Button>
          <Text style={emailStyles.footerText}>
            If you weren&apos;t expecting this invitation, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
