import { readFileSync } from 'node:fs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { hashPassword } from 'better-auth/crypto'
import { Pool } from 'pg'

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({
  adapter,
  transactionOptions: { timeout: 60_000 },
})

const fixturePath = new URL('./seed-fixture.json', import.meta.url)

const DEFAULT_VENDOR_CATEGORY_CONFIGS = {
  VENUE: [
    { key: 'max_guests', label: 'Max Guests', type: 'number', displayOrder: 0 },
    { key: 'ceremony_onsite', label: 'Ceremony Onsite', type: 'boolean', displayOrder: 1 },
    { key: 'outdoor_option', label: 'Outdoor Option', type: 'boolean', displayOrder: 2 },
    { key: 'rain_plan', label: 'Rain Plan', type: 'text', displayOrder: 3 },
  ],
  CATERING: [
    { key: 'service_style', label: 'Service Style', type: 'text', displayOrder: 0 },
    { key: 'menu_highlights', label: 'Menu Highlights', type: 'text', displayOrder: 1 },
    { key: 'tasting_included', label: 'Tasting Included', type: 'boolean', displayOrder: 2 },
    {
      key: 'dietary_flexibility',
      label: 'Dietary Flexibility',
      type: 'text',
      displayOrder: 3,
    },
  ],
  PHOTOGRAPHER: [
    { key: 'hours_included', label: 'Hours Included', type: 'number', displayOrder: 0 },
    { key: 'second_shooter', label: 'Second Shooter', type: 'boolean', displayOrder: 1 },
    { key: 'editing_style', label: 'Editing Style', type: 'text', displayOrder: 2 },
    { key: 'turnaround_weeks', label: 'Turnaround Weeks', type: 'number', displayOrder: 3 },
  ],
  VIDEOGRAPHER: [
    { key: 'hours_included', label: 'Hours Included', type: 'number', displayOrder: 0 },
    { key: 'drone_coverage', label: 'Drone Coverage', type: 'boolean', displayOrder: 1 },
    {
      key: 'highlight_film_length',
      label: 'Highlight Film Length',
      type: 'text',
      displayOrder: 2,
    },
    { key: 'turnaround_weeks', label: 'Turnaround Weeks', type: 'number', displayOrder: 3 },
  ],
  MUSIC: [
    { key: 'coverage_scope', label: 'Coverage Scope', type: 'text', displayOrder: 0 },
    { key: 'dj_or_live_band', label: 'DJ or Live Band', type: 'text', displayOrder: 1 },
    { key: 'mc_included', label: 'MC Included', type: 'boolean', displayOrder: 2 },
    {
      key: 'sound_equipment_included',
      label: 'Sound Equipment Included',
      type: 'boolean',
      displayOrder: 3,
    },
  ],
  FLOWERS: [
    { key: 'style_focus', label: 'Style Focus', type: 'text', displayOrder: 0 },
    {
      key: 'delivery_setup_included',
      label: 'Delivery + Setup Included',
      type: 'boolean',
      displayOrder: 1,
    },
    {
      key: 'breakdown_included',
      label: 'Breakdown Included',
      type: 'boolean',
      displayOrder: 2,
    },
    { key: 'budget_minimum', label: 'Budget Minimum', type: 'number', displayOrder: 3 },
  ],
  ACCOMMODATION: [
    { key: 'room_block_size', label: 'Room Block Size', type: 'number', displayOrder: 0 },
    { key: 'total_rooms', label: 'Total Rooms', type: 'number', displayOrder: 1 },
    { key: 'room_type', label: 'Room Type', type: 'text', displayOrder: 2 },
    { key: 'shuttle_included', label: 'Shuttle Included', type: 'boolean', displayOrder: 3 },
    { key: 'booking_deadline', label: 'Booking Deadline', type: 'text', displayOrder: 4 },
  ],
  OTHER: [
    { key: 'service_scope', label: 'Service Scope', type: 'text', displayOrder: 0 },
    { key: 'package_summary', label: 'Package Summary', type: 'text', displayOrder: 1 },
    { key: 'travel_included', label: 'Travel Included', type: 'boolean', displayOrder: 2 },
  ],
}

/** @param {{ isPrimary?: boolean; role?: string }} user */
function resolveSeedRole(user) {
  if (typeof user.role === 'string' && user.role.length > 0) {
    return user.role
  }

  return user.isPrimary ? 'owner' : 'member'
}

/** @returns {import('@prisma/client').Prisma.JsonObject} */
function loadFixture() {
  const raw = readFileSync(fixturePath, 'utf-8')
  return JSON.parse(raw)
}

async function seed() {
  const fixture = loadFixture()

  const eventIdBySlug = new Map()
  const tagIdBySlug = new Map()
  const guestByKey = new Map()
  const questionBySlug = new Map()
  const optionByKey = new Map()

  await prisma.$transaction(async (tx) => {
    await tx.vendorCategoryConfig.deleteMany({
      where: { weddingId: null },
    })

    await tx.wedding.deleteMany({ where: { id: fixture.wedding.id } })

    if (fixture.organization) {
      await tx.organization.deleteMany({ where: { id: fixture.organization.id } })
    }

    for (const user of fixture.users) {
      const userName = `${user.firstName} ${user.lastName}`
      const hashedPassword = await hashPassword(user.password)

      await tx.user.upsert({
        where: { email: user.email },
        update: {
          name: userName,
          emailVerified: true,
          websiteUrl: fixture.website.url,
          groomFirstName: fixture.wedding.groomFirstName,
          groomLastName: fixture.wedding.groomLastName,
          brideFirstName: fixture.wedding.brideFirstName,
          brideLastName: fixture.wedding.brideLastName,
        },
        create: {
          id: user.id,
          name: userName,
          email: user.email,
          emailVerified: true,
          websiteUrl: fixture.website.url,
          groomFirstName: fixture.wedding.groomFirstName,
          groomLastName: fixture.wedding.groomLastName,
          brideFirstName: fixture.wedding.brideFirstName,
          brideLastName: fixture.wedding.brideLastName,
        },
      })

      await tx.account.upsert({
        where: {
          providerId_accountId: {
            providerId: 'credential',
            accountId: user.id,
          },
        },
        update: {
          userId: user.id,
          password: hashedPassword,
        },
        create: {
          id: `account-${user.id}`,
          providerId: 'credential',
          accountId: user.id,
          userId: user.id,
          password: hashedPassword,
        },
      })
    }

    if (fixture.organization) {
      await tx.organization.create({
        data: {
          id: fixture.organization.id,
          name: fixture.organization.name,
          slug: fixture.organization.slug,
        },
      })

      for (const user of fixture.users) {
        await tx.member.create({
          data: {
            id: `member-${fixture.organization.id}-${user.id}`,
            organizationId: fixture.organization.id,
            userId: user.id,
            role: resolveSeedRole(user),
          },
        })
      }
    }

    await tx.wedding.create({
      data: {
        id: fixture.wedding.id,
        groomFirstName: fixture.wedding.groomFirstName,
        groomLastName: fixture.wedding.groomLastName,
        brideFirstName: fixture.wedding.brideFirstName,
        brideLastName: fixture.wedding.brideLastName,
        organizationId: fixture.wedding.organizationId ?? fixture.organization?.id ?? null,
        enabledAddOns: fixture.wedding.enabledAddOns,
        selfFillToken: fixture.wedding.selfFillToken,
        selfFillTokenGeneratedAt: new Date(fixture.wedding.selfFillTokenGeneratedAt),
      },
    })

    for (const [category, fieldDefinitions] of Object.entries(DEFAULT_VENDOR_CATEGORY_CONFIGS)) {
      await tx.vendorCategoryConfig.create({
        data: {
          category,
          weddingId: null,
          fieldDefinitions,
        },
      })
    }

    for (const user of fixture.users) {
      await tx.userWedding.create({
        data: {
          userId: user.id,
          weddingId: fixture.wedding.id,
          role: resolveSeedRole(user),
          isPrimary: user.isPrimary,
        },
      })
    }

    await tx.website.create({
      data: {
        id: fixture.website.id,
        weddingId: fixture.wedding.id,
        subUrl: fixture.website.subUrl,
        isPasswordEnabled: fixture.website.isPasswordEnabled,
        isRsvpEnabled: fixture.website.isRsvpEnabled,
        coverPhotoUrl: fixture.website.coverPhotoUrl,
        websiteSections: {
          create: {
            id: `website-section-home-${fixture.website.id}`,
            type: 'HOME',
            isEnabled: true,
            position: 0,
            content: { introText: '' },
          },
        },
      },
    })

    for (const event of fixture.events) {
      await tx.event.create({
        data: {
          id: event.id,
          weddingId: fixture.wedding.id,
          name: event.name,
          date: new Date(event.date),
          startTime: event.startTime,
          endTime: event.endTime,
          venue: event.venue,
          attire: event.attire,
          description: event.description,
          collectRsvp: event.collectRsvp,
        },
      })
      eventIdBySlug.set(event.slug, event.id)
    }

    for (const tag of fixture.guestTags) {
      await tx.guestTag.create({
        data: {
          id: tag.id,
          weddingId: fixture.wedding.id,
          name: tag.name,
          color: tag.color,
        },
      })
      tagIdBySlug.set(tag.slug, tag.id)
    }

    for (const household of fixture.households) {
      await tx.household.create({
        data: {
          id: household.id,
          weddingId: fixture.wedding.id,
          address1: household.address1,
          address2: household.address2,
          city: household.city,
          state: household.state,
          zipCode: household.zipCode,
          country: household.country,
          notes: household.notes,
        },
      })

      for (const guest of household.guests) {
        const createdGuest = await tx.guest.create({
          data: {
            weddingId: fixture.wedding.id,
            firstName: guest.firstName,
            lastName: guest.lastName,
            email: guest.email,
            phone: guest.phone,
            householdId: household.id,
            isPrimaryContact: guest.isPrimaryContact,
            ageGroup: guest.ageGroup,
          },
        })

        guestByKey.set(guest.key, {
          id: createdGuest.id,
          householdId: household.id,
        })

        for (const tagSlug of guest.tagSlugs) {
          const guestTagId = tagIdBySlug.get(tagSlug)
          if (!guestTagId) continue

          await tx.guestTagAssignment.create({
            data: {
              guestId: createdGuest.id,
              guestTagId,
            },
          })
        }

        for (const invitation of guest.invitations) {
          const eventId = eventIdBySlug.get(invitation.eventSlug)
          if (!eventId) continue

          await tx.invitation.create({
            data: {
              weddingId: fixture.wedding.id,
              guestId: createdGuest.id,
              eventId,
              rsvp: invitation.rsvp,
              dietaryRestrictions: invitation.dietaryRestrictions,
            },
          })
        }
      }
    }

    for (const gift of fixture.gifts) {
      const eventId = eventIdBySlug.get(gift.eventSlug)
      if (!eventId) continue

      await tx.gift.create({
        data: {
          householdId: gift.householdId,
          eventId,
          description: gift.description,
          thankyou: gift.thankyou,
        },
      })
    }

    for (const question of fixture.questions.event) {
      const eventId = eventIdBySlug.get(question.eventSlug)
      if (!eventId) continue

      const createdQuestion = await tx.question.create({
        data: {
          eventId,
          text: question.text,
          type: question.type,
          isRequired: question.isRequired,
        },
      })

      questionBySlug.set(question.slug, {
        id: createdQuestion.id,
        type: question.type,
      })

      for (const option of question.options) {
        const createdOption = await tx.option.create({
          data: {
            questionId: createdQuestion.id,
            text: option.text,
            description: option.description,
          },
        })

        optionByKey.set(`${question.slug}:${option.slug}`, createdOption.id)
      }
    }

    for (const question of fixture.questions.website) {
      const createdQuestion = await tx.question.create({
        data: {
          websiteId: fixture.website.id,
          text: question.text,
          type: question.type,
          isRequired: question.isRequired,
        },
      })

      questionBySlug.set(question.slug, {
        id: createdQuestion.id,
        type: question.type,
      })
    }

    for (const response of fixture.responses) {
      const guest = guestByKey.get(response.guestKey)
      const question = questionBySlug.get(response.questionSlug)
      if (!guest || !question) continue

      if (response.type === 'text') {
        await tx.answer.create({
          data: {
            questionId: question.id,
            guestId: guest.id,
            householdId: guest.householdId,
            response: response.response,
          },
        })
        continue
      }

      const optionId = optionByKey.get(`${response.questionSlug}:${response.optionSlug}`)
      if (!optionId) continue

      await tx.optionResponse.create({
        data: {
          questionId: question.id,
          optionId,
          guestId: guest.id,
          householdId: guest.householdId,
        },
      })
    }

    for (const vendor of fixture.vendors) {
      await tx.vendor.create({
        data: {
          id: vendor.id,
          weddingId: fixture.wedding.id,
          category: vendor.category,
          name: vendor.name,
          location: vendor.location,
          website: vendor.website,
          instagram: vendor.instagram,
          status: vendor.status,
          contactName: vendor.contactName,
          contactEmail: vendor.contactEmail,
          contactPhone: vendor.contactPhone,
          notes: vendor.notes ?? null,
          contacted: vendor.contacted ?? false,
          customFields: vendor.customFields ?? undefined,
          quotes: {
            create: vendor.quotes.map((quote) => ({
              price: quote.price,
              quoteDate: new Date(quote.quoteDate),
              notes: quote.notes,
            })),
          },
          vendorNotes: vendor.vendorNotes
            ? {
                create: vendor.vendorNotes.map((note) => ({
                  message: note.message,
                  actorType: note.actorType ?? 'couple',
                  weddingId: fixture.wedding.id,
                })),
              }
            : undefined,
        },
      })
    }
  })

  const summary = [
    'Shrek & Fiona comprehensive seed completed.',
    `- Users: ${fixture.users.length}`,
    `- Events: ${fixture.events.length}`,
    `- Households: ${fixture.households.length}`,
    `- Vendors: ${fixture.vendors.length}`,
  ].join('\n')

  process.stdout.write(`${summary}\n`)
}

seed()
  .catch((error) => {
    if (error instanceof AggregateError) {
      process.stderr.write(`Seed failed with AggregateError: ${error.message}\n`)
      for (const [index, cause] of error.errors.entries()) {
        process.stderr.write(`  [${index + 1}] ${String(cause)}\n`)
      }
    } else {
      process.stderr.write(`Seed failed: ${String(error)}\n`)
    }
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
