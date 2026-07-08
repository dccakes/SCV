import type { InboundAttachment } from '~/lib/email/resend-webhook'
import { heuristicTriage, type TriageInput } from '~/lib/email/triage'

function makeInput(overrides: Partial<TriageInput> = {}): TriageInput {
  return {
    fromAddress: 'someone@example.com',
    subject: 'Hello',
    text: 'Just checking in.',
    attachments: [],
    context: { wedding: { brideFirstName: 'Jane', groomFirstName: 'John' } },
    ...overrides,
  }
}

const pdf: InboundAttachment = {
  filename: 'contract.pdf',
  contentType: 'application/pdf',
  size: 2048,
}

describe('heuristicTriage', () => {
  it('flags a known vendor sending a contract for couple review', () => {
    const result = heuristicTriage(
      makeInput({
        subject: 'Signed contract attached',
        attachments: [pdf],
        context: {
          wedding: { brideFirstName: 'Jane', groomFirstName: 'John' },
          knownVendorName: 'Acme Florals',
        },
      })
    )
    expect(result.category).toBe('vendor_contract')
    expect(result.priority).toBe('high')
    expect(result.suggestedActions.map((a) => a.type)).toContain('forward_to_couple')
    expect(result.suggestedActions.map((a) => a.type)).toContain('log_communication')
  })

  it('classifies a known vendor general message', () => {
    const result = heuristicTriage(
      makeInput({
        subject: 'Quick scheduling note',
        text: 'Can we move the walkthrough to Friday?',
        context: {
          wedding: { brideFirstName: 'Jane', groomFirstName: 'John' },
          knownVendorName: 'Acme Florals',
        },
      })
    )
    expect(result.category).toBe('vendor_general')
    expect(result.suggestedActions.map((a) => a.type)).toContain('log_communication')
  })

  it('classifies guest RSVP language', () => {
    const result = heuristicTriage(
      makeInput({
        subject: 'RSVP',
        text: 'We will be attending, and I have a dietary allergy.',
      })
    )
    expect(result.category).toBe('guest_rsvp')
  })

  it('flags a guest question', () => {
    const result = heuristicTriage(
      makeInput({
        subject: 'Question about the venue',
        text: 'What time does the ceremony start?',
        context: {
          wedding: { brideFirstName: 'Jane', groomFirstName: 'John' },
          knownGuestName: 'Guest Person',
        },
      })
    )
    expect(result.category).toBe('guest_question')
    expect(result.suggestedActions.map((a) => a.type)).toContain('flag_guest_question')
  })

  it('detects a contract-like attachment from an unknown sender', () => {
    const result = heuristicTriage(makeInput({ subject: 'Proposal', attachments: [pdf] }))
    expect(result.category).toBe('vendor_contract')
    expect(result.suggestedActions.map((a) => a.type)).toContain('forward_to_couple')
  })

  it('always proposes at least one action', () => {
    const result = heuristicTriage(makeInput({ subject: 'hi', text: 'hi' }))
    expect(result.suggestedActions.length).toBeGreaterThan(0)
  })
})
