import { z } from 'zod'

import { ANALYTICS_ACTIONS, ANALYTICS_SCOPES, buildEventName } from '~/lib/analytics/events'
import {
  type HouseholdInviteRepository,
  isUniqueConstraintError,
  WEDDING_DAY_EVENT_NAME,
} from '~/server/application/household-invite/household-invite.repository'
import { createHouseholdInviteCode } from '~/server/application/household-invite/household-invite-code'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { HouseholdSearchResult } from '~/server/domains/household/household.types'
import {
  ConflictError,
  DomainError,
  ForbiddenError,
  InvariantViolationError,
  NotFoundError,
  PreconditionFailedError,
  ValidationError,
} from '~/server/domains/shared/domain-error'
import type { SaveTheDateSectionContent } from '~/server/domains/website-section/website-section.types'
import { saveTheDateSectionContentSchema } from '~/server/domains/website-section/website-section.validator'
import { captureServerEvent } from '~/server/infrastructure/analytics/capture'
import { sanitizePayload } from '~/server/infrastructure/analytics/payload'
import type { UnitOfWork } from '~/server/infrastructure/database/unit-of-work'

export type HouseholdInviteRepos = { invite: HouseholdInviteRepository }

export type HouseholdInviteGuestInput = {
  guestId: number
  firstName: string
  lastName: string | null
  email: string | null
  phone: string | null
}

export type UpdateHouseholdInviteInput = {
  address1: string | null
  address2: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  country: string | null
  guests: HouseholdInviteGuestInput[]
}

export type HouseholdInviteData = {
  weddingId: string
  expiresAt: Date
  /**
   * The wedding website template the couple selected. The invite card themes
   * itself with this so it matches the public Save the Date / Invitation pages.
   */
  templateId: string | null
  /**
   * The couple's editable Save the Date copy (when that section is enabled), so
   * the same customisation shown on the website surfaces flows into the invite.
   */
  saveTheDate?: SaveTheDateSectionContent
  wedding: {
    groomFirstName: string
    groomLastName: string
    brideFirstName: string
    brideLastName: string
    date: Date | null
    venue: string | null
  }
  /** Wedding events, used to build the "save the date" calendar block. */
  events: Array<{
    name: string
    date: Date | null
    venue: string | null
  }>
  household: {
    id: string
    address1: string | null
    address2: string | null
    city: string | null
    state: string | null
    zipCode: string | null
    country: string | null
  }
  guests: Array<{
    id: number
    firstName: string
    lastName: string
    email: string | null
    phone: string | null
    /** Travels with the household but isn't formally invited to the ceremony or dinner reception. */
    isTagAlong: boolean
  }>
}

const optionalTextSchema = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .nullable()

const optionalEmailSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
  z
    .string()
    .email()
    .or(z.literal('').transform(() => null))
    .nullable()
)

const normalizeOptionalText = (value: string | null) => optionalTextSchema.parse(value)

const normalizeUpdateInput = (input: UpdateHouseholdInviteInput): UpdateHouseholdInviteInput => {
  const guests = input.guests.map((guest) => {
    if (!Number.isInteger(guest.guestId) || guest.guestId <= 0) {
      throw new ValidationError('Guest details could not be matched to this household')
    }

    const firstName = guest.firstName.trim()
    if (!firstName) {
      throw new ValidationError('Each household member needs a first name')
    }

    return {
      guestId: guest.guestId,
      firstName,
      lastName: normalizeOptionalText(guest.lastName) ?? '',
      email: optionalEmailSchema.parse(guest.email),
      phone: normalizeOptionalText(guest.phone),
    }
  })

  const emails = guests
    .map((guest) => guest.email)
    .filter((email): email is string => Boolean(email))
  if (new Set(emails).size !== emails.length) {
    throw new ValidationError('Each email address can only be used once for this wedding')
  }

  return {
    address1: normalizeOptionalText(input.address1),
    address2: normalizeOptionalText(input.address2),
    city: normalizeOptionalText(input.city),
    state: normalizeOptionalText(input.state),
    zipCode: normalizeOptionalText(input.zipCode),
    country: normalizeOptionalText(input.country),
    guests,
  }
}

const normalizeBaseUrl = (baseUrl: string) => {
  try {
    const parsed = new URL(baseUrl)
    return parsed.origin
  } catch {
    throw new ValidationError('Unable to generate invite link for this website origin')
  }
}

export class HouseholdInviteService {
  constructor(
    private repository: HouseholdInviteRepository,
    private unitOfWork: UnitOfWork<HouseholdInviteRepos>
  ) {}

  async generateInviteLink(
    ctx: AuthzContext,
    weddingId: string,
    input: { householdId: string; baseUrl: string }
  ): Promise<{ url: string; expiresAt: Date }> {
    requirePermission(ctx, { guest_invitation: ['send'] })

    const household = await this.repository.findHouseholdForInviteLink(input.householdId, weddingId)

    if (!household) {
      throw new NotFoundError('Household not found')
    }

    const website = await this.repository.findWebsiteSubUrlByWeddingId(weddingId)

    if (!website) {
      throw new PreconditionFailedError(
        'Publish a wedding website before generating household invite links'
      )
    }

    const expiresAt = new Date()
    expiresAt.setUTCFullYear(expiresAt.getUTCFullYear() + 1)
    const code = await this.assignInviteCode(household.id, household.guests, expiresAt)

    return {
      url: `${normalizeBaseUrl(input.baseUrl)}/w/${website.subUrl}/save-the-date/${code}`,
      expiresAt,
    }
  }

  /**
   * Assigns a short invite code to the household, retrying on the rare
   * collision with another household's code (the DB unique constraint is the
   * source of truth). Reused links keep the same code and just get a fresh
   * expiry.
   */
  private async assignInviteCode(
    householdId: string,
    guests: Array<{ firstName: string; lastName: string | null }>,
    expiresAt: Date
  ): Promise<string> {
    const maxAttempts = 5
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const code = createHouseholdInviteCode(guests)
      if (await this.repository.trySetInviteCode(householdId, code, expiresAt)) {
        return code
      }
    }

    throw new InvariantViolationError('Could not generate a unique invite code')
  }

  async getPublicWeddingSummary(subUrl: string): Promise<{
    groomFirstName: string
    brideFirstName: string
    date: Date | null
    venue: string | null
  } | null> {
    const website = await this.repository.findWeddingSummaryBySubUrl(subUrl)

    if (!website) return null

    const weddingDayEvent = website.wedding.events[0]
    return {
      groomFirstName: website.wedding.groomFirstName,
      brideFirstName: website.wedding.brideFirstName,
      date: weddingDayEvent?.date ?? null,
      venue: weddingDayEvent?.venue ?? null,
    }
  }

  async getInviteData(subUrl: string, code: string | null | undefined) {
    const scopedInvite = await this.resolveInviteScope(subUrl, code)
    if (!scopedInvite) return null

    return this.loadHouseholdInviteData(
      scopedInvite.weddingId,
      scopedInvite.householdId,
      scopedInvite.expiresAt
    )
  }

  /**
   * Resolve the household behind a guest's invite code in the RSVP flow shape,
   * so a recognized guest can RSVP without searching for their name. Returns
   * null when the code is missing, expired, or not scoped to this website's
   * wedding. Reuses the same select as the public name search, so the RSVP form
   * receives identical data from either entry point.
   */
  async getRecognizedRsvpHousehold(
    subUrl: string,
    code: string | null | undefined
  ): Promise<HouseholdSearchResult | null> {
    const scopedInvite = await this.resolveInviteScope(subUrl, code)
    if (!scopedInvite) return null

    return this.repository.findRsvpHousehold(scopedInvite.householdId, scopedInvite.weddingId)
  }

  async updateHouseholdDetails(
    subUrl: string,
    code: string | null | undefined,
    input: UpdateHouseholdInviteInput
  ): Promise<{ success: true }> {
    const inviteData = await this.getInviteData(subUrl, code)
    if (!inviteData) {
      throw new ForbiddenError('Invalid or expired household invite')
    }

    let normalizedInput: UpdateHouseholdInviteInput
    try {
      normalizedInput = normalizeUpdateInput(input)
    } catch (error) {
      if (error instanceof DomainError) throw error
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          'Please enter a valid email address or leave the email field blank'
        )
      }
      throw error
    }

    const allowedGuestIds = new Set(inviteData.guests.map((guest) => guest.id))
    const hasInvalidGuest = normalizedInput.guests.some(
      (guest) => !allowedGuestIds.has(guest.guestId)
    )

    if (hasInvalidGuest) {
      throw new ForbiddenError('Guest update is outside this household invite')
    }

    try {
      await this.unitOfWork(async ({ invite }) => {
        const submittedEmails = normalizedInput.guests
          .map((guest) => guest.email)
          .filter((email): email is string => Boolean(email))

        if (submittedEmails.length > 0) {
          const emailTaken = await invite.emailTakenByOtherGuest(
            inviteData.weddingId,
            submittedEmails,
            normalizedInput.guests.map((guest) => guest.guestId)
          )

          if (emailTaken) {
            throw new ConflictError('Each email address can only be used once for this wedding')
          }
        }

        const householdUpdateCount = await invite.updateHouseholdAddress(
          inviteData.household.id,
          inviteData.weddingId,
          {
            address1: normalizedInput.address1,
            address2: normalizedInput.address2,
            city: normalizedInput.city,
            state: normalizedInput.state,
            zipCode: normalizedInput.zipCode,
            country: normalizedInput.country,
          }
        )

        if (householdUpdateCount !== 1) {
          throw new ForbiddenError('Invalid or expired household invite')
        }

        await Promise.all(
          normalizedInput.guests.map(async (guest) => {
            const guestUpdateCount = await invite.updateGuestDetails(
              guest.guestId,
              { householdId: inviteData.household.id, weddingId: inviteData.weddingId },
              {
                firstName: guest.firstName,
                lastName: guest.lastName ?? '',
                email: guest.email,
                phone: guest.phone,
              }
            )

            if (guestUpdateCount !== 1) {
              throw new ForbiddenError('Guest update is outside this household invite')
            }
          })
        )
      })
    } catch (error) {
      if (error instanceof DomainError) throw error
      if (isUniqueConstraintError(error)) {
        throw new ConflictError('Each email address can only be used once for this wedding')
      }
      throw error
    }

    // Analytics: guest self-service info update via the public invite link. This
    // flow uses a server action (not tRPC), so it is instrumented directly here.
    captureServerEvent({
      event: buildEventName({
        scope: ANALYTICS_SCOPES.guestList,
        object: 'household_details',
        action: ANALYTICS_ACTIONS.updated,
      }),
      context: {
        distinctId: code ?? inviteData.household.id,
        isAuthenticated: false,
        weddingId: inviteData.weddingId,
        householdId: inviteData.household.id,
        subUrl,
        ...(code ? { token: code } : {}),
      },
      properties: {
        num_guests: normalizedInput.guests.length,
        payload: sanitizePayload(normalizedInput),
      },
    })

    return { success: true }
  }

  /**
   * Whether an invite code is currently active (unexpired) and, if so, which
   * household/wedding it's scoped to. Shared by every consumer that only
   * needs to check the code, not fully load the household's invite data.
   */
  private async findActiveHouseholdByInviteCode(code: string | null | undefined): Promise<{
    id: string
    weddingId: string
    inviteCodeExpiresAt: Date
  } | null> {
    if (!code) return null

    const household = await this.repository.findHouseholdByInviteCode(code)

    if (!household?.inviteCodeExpiresAt) return null
    if (household.inviteCodeExpiresAt.getTime() <= Date.now()) return null

    return {
      id: household.id,
      weddingId: household.weddingId,
      inviteCodeExpiresAt: household.inviteCodeExpiresAt,
    }
  }

  /**
   * Whether a guest's invite code is valid and scoped to this wedding, so a
   * password-protected site can be unlocked without a fresh DB lookup for the
   * household details.
   */
  async isInviteCodeValidForWedding(code: string | undefined, weddingId: string): Promise<boolean> {
    const household = await this.findActiveHouseholdByInviteCode(code)
    return household?.weddingId === weddingId
  }

  private async resolveInviteScope(subUrl: string, code: string | null | undefined) {
    const household = await this.findActiveHouseholdByInviteCode(code)
    if (!household) return null

    const website = await this.repository.findWeddingIdBySubUrl(subUrl)

    if (!website || website.weddingId !== household.weddingId) return null

    return {
      weddingId: household.weddingId,
      householdId: household.id,
      expiresAt: household.inviteCodeExpiresAt,
    }
  }

  private async loadHouseholdInviteData(
    weddingId: string,
    householdId: string,
    expiresAt: Date
  ): Promise<HouseholdInviteData | null> {
    // The selected template and Save the Date copy live on the website; load
    // them so the invite card mirrors the public Save the Date / Invitation
    // surfaces instead of falling back to the app's default look.
    const [household, website] = await Promise.all([
      this.repository.findHouseholdInviteDetails(householdId, weddingId),
      this.repository.findWebsiteInviteTheme(weddingId),
    ])

    if (!household) return null

    const { events, ...weddingNames } = household.wedding
    // The primary date/venue come from the "Wedding Day" event; the full event
    // list drives the save-the-date calendar block.
    const weddingDayEvent = events.find((event) => event.name === WEDDING_DAY_EVENT_NAME)

    // Mirror the website surfaces: only enabled Save the Date copy overrides the
    // template defaults, and malformed stored content is ignored rather than thrown.
    const saveTheDateSection = website?.websiteSections?.[0]
    const parsedSaveTheDate = saveTheDateSection?.isEnabled
      ? saveTheDateSectionContentSchema.safeParse(saveTheDateSection.content)
      : undefined
    const saveTheDate = parsedSaveTheDate?.success ? parsedSaveTheDate.data : undefined

    return {
      weddingId,
      expiresAt,
      templateId: website?.templateId ?? null,
      saveTheDate,
      wedding: {
        ...weddingNames,
        date: weddingDayEvent?.date ?? null,
        venue: weddingDayEvent?.venue ?? null,
      },
      events,
      household: {
        id: household.id,
        address1: household.address1,
        address2: household.address2,
        city: household.city,
        state: household.state,
        zipCode: household.zipCode,
        country: household.country,
      },
      guests: household.guests,
    }
  }
}
