/**
 * Guest Domain - Repository Mock
 *
 * Jest mock for the GuestRepository class.
 * Used for unit testing the GuestService.
 */

import { type Guest, type GuestWithInvitations } from '~/server/domains/guest/guest.types'

export const mockGuestRepository = {
  findById: jest.fn<Promise<Guest | null>, [number]>(),
  findByIdWithInvitations: jest.fn<Promise<GuestWithInvitations | null>, [number]>(),
  findByUserId: jest.fn<Promise<Guest[]>, [string]>(),
  findByHouseholdId: jest.fn<Promise<Guest[]>, [string]>(),
  findByHouseholdIdWithInvitations: jest.fn<Promise<GuestWithInvitations[]>, [string]>(),
  create: jest.fn<Promise<Guest>, [{ firstName: string; lastName: string; householdId: string; userId: string; isPrimaryContact?: boolean }]>(),
  createWithInvitations: jest.fn<Promise<Guest>, [{ firstName: string; lastName: string; householdId: string; userId: string; isPrimaryContact?: boolean; invitations: Array<{ eventId: string; rsvp: string; userId: string }> }]>(),
  update: jest.fn<Promise<Guest>, [number, { firstName?: string; lastName?: string }]>(),
  upsert: jest.fn<Promise<Guest>, [number | undefined, { firstName: string; lastName: string; householdId: string; userId: string; isPrimaryContact?: boolean }, Array<{ eventId: string; rsvp: string; userId: string }> | undefined]>(),
  delete: jest.fn<Promise<Guest>, [number]>(),
  deleteMany: jest.fn<Promise<{ count: number }>, [number[]]>(),
  exists: jest.fn<Promise<boolean>, [number]>(),
  belongsToUser: jest.fn<Promise<boolean>, [number, string]>(),
}

export const GuestRepository = jest.fn().mockImplementation(() => mockGuestRepository)
