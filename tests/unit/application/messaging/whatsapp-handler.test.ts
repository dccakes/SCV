/**
 * Tests for WhatsAppHandler — guest resolution, debounce, Etta concierge invocation.
 */

import type { TwilioInboundMessage } from '~/lib/whatsapp/types'
import { WhatsAppHandler } from '~/server/application/messaging/whatsapp-handler'

const SERVICE_NUMBER = '+14155550100'
const GUEST_PHONE = '+5215512345678'

const makeInbound = (overrides: Partial<TwilioInboundMessage> = {}): TwilioInboundMessage => ({
  MessageSid: 'SM123',
  From: `whatsapp:${GUEST_PHONE}`,
  To: `whatsapp:${SERVICE_NUMBER}`,
  Body: 'What time is the ceremony?',
  ProfileName: 'Maria',
  ...overrides,
})

const baseIdentity = {
  id: 'identity-wa-1',
  weddingId: 'wedding-123',
  channel: 'whatsapp',
  serviceNumber: SERVICE_NUMBER,
  externalChatId: GUEST_PHONE,
  externalUserId: null,
  displayName: 'Maria',
  linkedByUserId: null,
  householdId: 'household-1',
  guestId: 7,
  linkedAt: new Date(),
  revokedAt: null,
  pendingInvokeSeq: 0,
}

function buildHandler() {
  const messaging = {
    resolveInboundWhatsApp: jest.fn(),
    appendMessage: jest.fn().mockResolvedValue({}),
    loadConversation: jest.fn().mockResolvedValue([]),
    bumpPendingInvokeSeq: jest.fn().mockResolvedValue(1),
    getPendingInvokeSeq: jest.fn().mockResolvedValue(1),
  }
  const wa = {
    sendMessage: jest.fn().mockResolvedValue({ sid: 'SM-out' }),
  }
  const runEtta = jest.fn()
  const sleep = jest.fn().mockResolvedValue(undefined)

  const handler = new WhatsAppHandler({
    messaging: messaging as never,
    wa: wa as never,
    runEtta: runEtta as never,
    debounceMs: 100,
    sleep,
  })

  return { handler, messaging, wa, runEtta, sleep }
}

describe('WhatsAppHandler', () => {
  it('ignores messages to numbers we do not own', async () => {
    const { handler, messaging, wa } = buildHandler()
    messaging.resolveInboundWhatsApp.mockResolvedValue({ status: 'unknown_number' })

    await handler.handle(makeInbound())

    expect(wa.sendMessage).not.toHaveBeenCalled()
    expect(messaging.appendMessage).not.toHaveBeenCalled()
  })

  it('politely declines senders not on the guest list', async () => {
    const { handler, messaging, wa } = buildHandler()
    messaging.resolveInboundWhatsApp.mockResolvedValue({
      status: 'unknown_guest',
      weddingId: 'wedding-123',
    })

    await handler.handle(makeInbound())

    expect(wa.sendMessage).toHaveBeenCalledWith(
      SERVICE_NUMBER,
      GUEST_PHONE,
      expect.stringContaining("couldn't find")
    )
    expect(messaging.appendMessage).not.toHaveBeenCalled()
  })

  it('runs Etta as guest concierge and replies over WhatsApp', async () => {
    const { handler, messaging, wa, runEtta } = buildHandler()
    messaging.resolveInboundWhatsApp.mockResolvedValue({
      status: 'ok',
      weddingId: 'wedding-123',
      identity: baseIdentity,
    })
    messaging.loadConversation.mockResolvedValue([
      { role: 'user', content: 'What time is the ceremony?', createdAt: new Date() },
    ])
    runEtta.mockResolvedValue({ text: Promise.resolve('The ceremony starts at 4pm.') })

    await handler.handle(makeInbound())

    // Inbound persisted with the Twilio message id for dedupe
    expect(messaging.appendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        identityId: 'identity-wa-1',
        weddingId: 'wedding-123',
        role: 'user',
        content: 'What time is the ceremony?',
        externalMessageId: 'SM123',
      })
    )

    // Etta runs with the guest persona for this guest
    expect(runEtta).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: 'guest',
        weddingId: 'wedding-123',
        guestId: 7,
      })
    )

    // Reply goes back over WhatsApp and is persisted
    expect(wa.sendMessage).toHaveBeenCalledWith(
      SERVICE_NUMBER,
      GUEST_PHONE,
      'The ceremony starts at 4pm.'
    )
    expect(messaging.appendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'assistant', content: 'The ceremony starts at 4pm.' })
    )
  })

  it('collapses bursts: only the latest debounce seq invokes Etta', async () => {
    const { handler, messaging, runEtta } = buildHandler()
    messaging.resolveInboundWhatsApp.mockResolvedValue({
      status: 'ok',
      weddingId: 'wedding-123',
      identity: baseIdentity,
    })
    messaging.bumpPendingInvokeSeq.mockResolvedValue(1)
    // Another message arrived while we were sleeping
    messaging.getPendingInvokeSeq.mockResolvedValue(2)

    await handler.handle(makeInbound())

    expect(runEtta).not.toHaveBeenCalled()
  })

  it('ignores empty bodies (media-only messages)', async () => {
    const { handler, messaging, runEtta } = buildHandler()
    messaging.resolveInboundWhatsApp.mockResolvedValue({
      status: 'ok',
      weddingId: 'wedding-123',
      identity: baseIdentity,
    })

    await handler.handle(makeInbound({ Body: '   ' }))

    expect(messaging.appendMessage).not.toHaveBeenCalled()
    expect(runEtta).not.toHaveBeenCalled()
  })
})
