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
            role: user.isPrimary ? 'owner' : 'member',
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

    for (const user of fixture.users) {
      await tx.userWedding.create({
        data: {
          userId: user.id,
          weddingId: fixture.wedding.id,
          role: user.isPrimary ? 'owner' : 'member',
          isPrimary: user.isPrimary,
        },
      })
    }

    await tx.website.create({
      data: {
        id: fixture.website.id,
        weddingId: fixture.wedding.id,
        url: fixture.website.url,
        subUrl: fixture.website.subUrl,
        isPasswordEnabled: fixture.website.isPasswordEnabled,
        isRsvpEnabled: fixture.website.isRsvpEnabled,
        coverPhotoUrl: fixture.website.coverPhotoUrl,
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
          quotes: {
            create: vendor.quotes.map((quote) => ({
              price: quote.price,
              quoteDate: new Date(quote.quoteDate),
              notes: quote.notes,
            })),
          },
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
