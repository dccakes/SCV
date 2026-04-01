import { TRPCError } from '@trpc/server'

import type { ActiveOrganization } from '~/server/authz/authorization.types'

export type OrganizationScopeEntityName = 'event' | 'guest' | 'invitation'

export type AssertEntityInActiveOrganizationInput = {
  activeOrganization: ActiveOrganization
  entityName: OrganizationScopeEntityName
  entityId: string
  entityOrganizationId: string | null
}

export type InvitationIdentifier = {
  guestId: number
  eventId: string
}

export interface EventOrganizationScopeRepository {
  findOrganizationIdByEventId(eventId: string): Promise<string | null>
}

export interface GuestOrganizationScopeRepository {
  findOrganizationIdByGuestId(guestId: number): Promise<string | null>
}

export interface InvitationOrganizationScopeRepository {
  findOrganizationIdByInvitationId(invitation: InvitationIdentifier): Promise<string | null>
}

type AssertEventInActiveOrganizationInput = {
  activeOrganization: ActiveOrganization
  eventId: string
  eventRepository: EventOrganizationScopeRepository
}

type AssertGuestInActiveOrganizationInput = {
  activeOrganization: ActiveOrganization
  guestId: number
  guestRepository: GuestOrganizationScopeRepository
}

type AssertInvitationInActiveOrganizationInput = {
  activeOrganization: ActiveOrganization
  invitation: InvitationIdentifier
  invitationRepository: InvitationOrganizationScopeRepository
}

const preconditionFailed = (message: string): never => {
  throw new TRPCError({ code: 'PRECONDITION_FAILED', message })
}

const permissionDenied = (entityName: OrganizationScopeEntityName, entityId: string): never => {
  throw new TRPCError({
    code: 'FORBIDDEN',
    message: `${entityName} ${entityId} is outside the active organization scope`,
  })
}

export const assertEntityInActiveOrganization = (
  input: AssertEntityInActiveOrganizationInput
): void => {
  if (!input.entityOrganizationId) {
    preconditionFailed(`Unable to resolve organization for ${input.entityName} ${input.entityId}`)
  }

  if (input.entityOrganizationId !== input.activeOrganization.organizationId) {
    permissionDenied(input.entityName, input.entityId)
  }
}

export const assertEventInActiveOrganization = async (
  input: AssertEventInActiveOrganizationInput
): Promise<void> => {
  const organizationId = await input.eventRepository.findOrganizationIdByEventId(input.eventId)

  assertEntityInActiveOrganization({
    activeOrganization: input.activeOrganization,
    entityName: 'event',
    entityId: input.eventId,
    entityOrganizationId: organizationId,
  })
}

export const assertGuestInActiveOrganization = async (
  input: AssertGuestInActiveOrganizationInput
): Promise<void> => {
  const organizationId = await input.guestRepository.findOrganizationIdByGuestId(input.guestId)

  assertEntityInActiveOrganization({
    activeOrganization: input.activeOrganization,
    entityName: 'guest',
    entityId: String(input.guestId),
    entityOrganizationId: organizationId,
  })
}

export const assertInvitationInActiveOrganization = async (
  input: AssertInvitationInActiveOrganizationInput
): Promise<void> => {
  const organizationId = await input.invitationRepository.findOrganizationIdByInvitationId(
    input.invitation
  )

  assertEntityInActiveOrganization({
    activeOrganization: input.activeOrganization,
    entityName: 'invitation',
    entityId: `${input.invitation.guestId}:${input.invitation.eventId}`,
    entityOrganizationId: organizationId,
  })
}
