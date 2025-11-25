/**
 * Invitation Domain - Repository Mock
 *
 * Jest mock for the InvitationRepository class.
 * Used for unit testing the InvitationService.
 */

import { type Invitation } from '~/server/domains/invitation/invitation.types'

export const mockInvitationRepository = {
  findById: jest.fn<Promise<Invitation | null>, [number, string]>(),
  findByUserId: jest.fn<Promise<Invitation[]>, [string]>(),
  findByEventId: jest.fn<Promise<Invitation[]>, [string]>(),
  findByGuestId: jest.fn<Promise<Invitation[]>, [number]>(),
  create: jest.fn<Promise<Invitation>, [{ guestId: number; eventId: string; rsvp: string; userId: string }]>(),
  createMany: jest.fn<Promise<{ count: number }>, [Array<{ guestId: number; eventId: string; rsvp: string; userId: string }>]>(),
  update: jest.fn<Promise<Invitation>, [number, string, { rsvp?: string }]>(),
  delete: jest.fn<Promise<Invitation>, [number, string]>(),
  exists: jest.fn<Promise<boolean>, [number, string]>(),
  getRsvpCountsByEventId: jest.fn<Promise<{ attending: number; invited: number; declined: number; notInvited: number }>, [string]>(),
}

export const InvitationRepository = jest.fn().mockImplementation(() => mockInvitationRepository)
