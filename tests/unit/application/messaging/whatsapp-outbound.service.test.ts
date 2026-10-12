/**
 * Tests for WhatsAppOutboundService — couple → household updates over WhatsApp.
 */

import { TRPCError } from '@trpc/server'

jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(),
}))

import { WhatsAppOutboundService } from '~/server/application/messaging/whatsapp-outbound.service'
import type { AuthzContext } from '~/server/authz/authorization.types'

const ctx: AuthzContext = {
  userId: 'user-1',
  activeOrganization: { organizationId: 'org-1', role: 'owner' },
}

const SERVICE_NUMBER = '+14155550100'

const waNumber = {
  id: 'wanum-1',
  phoneNumber: SERVICE_NUMBER,
  weddingId: 'wedding-123',
  provider: 'twilio',
  status: 'assigned',
}

const identityRecipient = {
  householdId: 'household-1',
  phone: '+5215512345678',
  identityId: 'identity-wa-1',
  guestId: 7,
  displayName: 'Maria Lopez',
}

const phoneOnlyRecipient = {
  householdId: 'household-2',
  phone: '+15550001111',
  identityId: null,
  guestId: 9,
  displayName: 'Ben Kim',
}

function buildService() {
  const messaging = {
    getWeddingWhatsAppNumber: jest.fn().mockResolvedValue(waNumber),
    getBroadcastRecipients: jest.fn().mockResolvedValue({
      recipients: [identityRecipient, phoneOnlyRecipient],
      unreachableHouseholdIds: ['household-3'],
    }),
    ensureWhatsAppIdentity: jest.fn().mockResolvedValue({
      id: 'identity-wa-2',
      weddingId: 'wedding-123',
    }),
    appendMessage: jest.fn().mockResolvedValue({}),
  }
  const wa = {
    sendMessage: jest.fn().mockResolvedValue({ sid: 'SM-out' }),
  }
  const service = new WhatsAppOutboundService({
    messaging: messaging as never,
    wa: wa as never,
  })
  return { service, messaging, wa }
}

describe('WhatsAppOutboundService', () => {
  describe('broadcast', () => {
    it('sends the update to every reachable household and persists it in each conversation', async () => {
      const { service, messaging, wa } = buildService()

      const result = await service.broadcast(ctx, {
        weddingId: 'wedding-123',
        message: 'Venue changed to the Garden Hall!',
      })

      expect(wa.sendMessage).toHaveBeenCalledTimes(2)
      expect(wa.sendMessage).toHaveBeenCalledWith(
        SERVICE_NUMBER,
        '+5215512345678',
        'Venue changed to the Garden Hall!'
      )
      expect(wa.sendMessage).toHaveBeenCalledWith(
        SERVICE_NUMBER,
        '+15550001111',
        'Venue changed to the Garden Hall!'
      )

      // Existing conversation reuses its identity; phone-only recipient gets one
      expect(messaging.ensureWhatsAppIdentity).toHaveBeenCalledWith(
        expect.objectContaining({ householdId: 'household-2', guestId: 9 })
      )
      expect(messaging.appendMessage).toHaveBeenCalledTimes(2)
      expect(messaging.appendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          identityId: 'identity-wa-1',
          role: 'assistant',
          content: 'Venue changed to the Garden Hall!',
        })
      )

      expect(result).toEqual({ sent: 2, failed: 0, unreachableHouseholds: 1 })
    })

    it('counts per-recipient send failures without aborting the run', async () => {
      const { service, wa, messaging } = buildService()
      wa.sendMessage
        .mockRejectedValueOnce(new Error('Twilio API 63016: outside window'))
        .mockResolvedValueOnce({ sid: 'SM-2' })

      const result = await service.broadcast(ctx, { weddingId: 'wedding-123', message: 'hi' })

      expect(result.sent).toBe(1)
      expect(result.failed).toBe(1)
      // Failed sends are not written into the conversation
      expect(messaging.appendMessage).toHaveBeenCalledTimes(1)
    })

    it('throws when the wedding has no WhatsApp number yet', async () => {
      const { service, messaging } = buildService()
      messaging.getWeddingWhatsAppNumber.mockResolvedValue(null)

      await expect(
        service.broadcast(ctx, { weddingId: 'wedding-123', message: 'hi' })
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('sendToHousehold', () => {
    it('sends to the household recipient and persists the message', async () => {
      const { service, wa, messaging } = buildService()

      const result = await service.sendToHousehold(ctx, {
        weddingId: 'wedding-123',
        householdId: 'household-1',
        message: 'Quick update for your family!',
      })

      expect(wa.sendMessage).toHaveBeenCalledWith(
        SERVICE_NUMBER,
        '+5215512345678',
        'Quick update for your family!'
      )
      expect(messaging.appendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ identityId: 'identity-wa-1', role: 'assistant' })
      )
      expect(result.identityId).toBe('identity-wa-1')
    })

    it('throws NOT_FOUND when the household has no reachable phone', async () => {
      const { service } = buildService()

      await expect(
        service.sendToHousehold(ctx, {
          weddingId: 'wedding-123',
          householdId: 'household-3',
          message: 'hi',
        })
      ).rejects.toThrow(TRPCError)
    })
  })
})
