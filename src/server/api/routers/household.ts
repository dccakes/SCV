import { type Guest as PrismaGuest } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { type Household, type Invitation } from '~/app/utils/shared-types'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'

// Define the update input schema separately to extract types
const updateInputSchema = z.object({
  householdId: z.string(),
  guestParty: z.array(
    z.object({
      guestId: z.number().optional(),
      firstName: z.string().nonempty({ message: 'First name required' }),
      lastName: z.string().nonempty({ message: 'Last name required' }),
      invites: z.record(z.string(), z.string()),
    })
  ),
  address1: z.string().nullish().optional(),
  address2: z.string().nullish().optional(),
  city: z.string().nullish().optional(),
  state: z.string().nullish().optional(),
  country: z.string().nullish().optional(),
  zipCode: z.string().nullish().optional(),
  phone: z.string().nullish().optional(),
  email: z.string().email({ message: 'Not a valid email' }).nullish().optional(),
  notes: z.string().nullish().optional(),
  deletedGuests: z.array(z.number()).optional(),
  gifts: z.array(
    z.object({
      eventId: z.string(),
      thankyou: z.boolean(),
      description: z.string().optional().nullish(),
    })
  ),
})

type UpdateInput = z.infer<typeof updateInputSchema>
type GuestPartyItem = UpdateInput['guestParty'][number]
type GiftItem = UpdateInput['gifts'][number]

export const householdRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        guestParty: z.array(
          z.object({
            firstName: z.string().nonempty({ message: 'First name required' }),
            lastName: z.string().nonempty({ message: 'Last name required' }),
            invites: z.record(z.string(), z.string()),
          })
        ),
        address1: z.string().nullish().optional(),
        address2: z.string().nullish().optional(),
        city: z.string().nullish().optional(),
        state: z.string().nullish().optional(),
        country: z.string().nullish().optional(),
        zipCode: z.string().nullish().optional(),
        phone: z.string().nullish().optional(),
        email: z.string().email({ message: 'Not a valid email' }).nullish().optional(),
        notes: z.string().nullish().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.auth.userId

      const household = await ctx.db.household.create({
        data: {
          userId,
          address1: input?.address1,
          address2: input?.address2,
          city: input?.city,
          state: input?.state,
          country: input?.country,
          zipCode: input?.zipCode,
          phone: input?.phone,
          email: input?.email,
          notes: input?.notes,
          gifts: {
            createMany: {
              data: Object.entries(input.guestParty[0]!.invites).map(([eventId, _]) => {
                return {
                  eventId,
                  thankyou: false,
                }
              }),
            },
          },
        },
        include: {
          gifts: true,
        },
      })

      if (!household) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create household',
        })
      }

      // TODO: look into db nested queries for ACID compliance
      const newGuests = await Promise.all(
        input.guestParty.map(async (guest, i) => {
          return await ctx.db.guest.create({
            data: {
              firstName: guest.firstName,
              lastName: guest.lastName,
              userId,
              householdId: household.id,
              isPrimaryContact: i === 0,
              invitations: {
                createMany: {
                  data: Object.entries(guest.invites).map(([eventId, rsvp]) => ({
                    eventId,
                    rsvp: rsvp,
                    userId,
                  })),
                },
              },
            },
          })
        })
      )

      if (!newGuests) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create guests',
        })
      }

      const householdData: Household = {
        ...household,
        guests: await Promise.all(
          newGuests.map(async (guest: PrismaGuest) => {
            return {
              ...guest,
              invitations: await ctx.db.invitation.findMany({
                where: {
                  guestId: guest.id,
                },
              }),
            }
          })
        ),
      }

      return householdData
    }),

  update: protectedProcedure.input(updateInputSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.auth.userId

    const updatedHousehold = await ctx.db.household.update({
      where: {
        id: input.householdId,
      },
      data: {
        address1: input.address1 ?? undefined,
        address2: input.address2 ?? undefined,
        city: input.city ?? undefined,
        state: input.state ?? undefined,
        country: input.country ?? undefined,
        zipCode: input.zipCode ?? undefined,
        phone: input.phone ?? undefined,
        email: input.email ?? undefined,
        notes: input.notes ?? undefined,
      },
    })

    await ctx.db.guest.deleteMany({
      where: {
        id: {
          in: input.deletedGuests,
        },
      },
    })

    const updatedGuestParty = await Promise.all(
      input.guestParty.map(async (guest: GuestPartyItem) => {
        const updatedGuest = await ctx.db.guest.upsert({
          where: {
            id: guest.guestId ?? -1, // db throws error if trying to upsert with undefined id - use unreachable integer as id to bring execution to the create block
          },
          update: {
            firstName: guest.firstName ?? undefined,
            lastName: guest.lastName ?? undefined,
          },
          create: {
            firstName: guest.firstName,
            lastName: guest.lastName,
            userId,
            householdId: input.householdId,
            isPrimaryContact: false,
            invitations: {
              createMany: {
                data: Object.entries(guest.invites).map(([eventId, rsvp]) => ({
                  eventId,
                  rsvp: rsvp,
                  userId,
                })),
              },
            },
          },
        })

        const updatedInvitations: Invitation[] = await Promise.all(
          Object.entries(guest.invites).map(async ([inviteEventId, inputRsvp]) => {
            return await ctx.db.invitation.update({
              where: {
                invitationId: {
                  eventId: inviteEventId,
                  guestId: guest.guestId ?? updatedGuest.id, // if guest is added to existing party, use that id here upserted from above
                },
              },
              data: {
                rsvp: inputRsvp ?? undefined,
              },
            })
          })
        )

        if (updatedInvitations.length !== Object.keys(guest.invites).length) {
          return Promise.reject(new Error('Failed to update all invitations'))
        }

        return {
          ...updatedGuest,
          invitations: updatedInvitations,
        }
      })
    )

    if (!updatedHousehold || !updatedGuestParty) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update guests',
      })
    }

    const updatedGifts = await Promise.all(
      input.gifts.map(async (gift: GiftItem) => {
        const updatedGuest = await ctx.db.gift.upsert({
          where: {
            GiftId: {
              eventId: gift.eventId,
              householdId: input.householdId,
            },
          },
          update: {
            description: gift.description,
            thankyou: gift.thankyou,
          },
          create: {
            householdId: input.householdId,
            eventId: gift.eventId,
            description: gift.description,
            thankyou: gift.thankyou,
          },
        })
        return updatedGuest
      })
    )

    return {
      ...updatedHousehold,
      guests: updatedGuestParty,
      gifts: updatedGifts,
    }
  }),

  delete: protectedProcedure
    .input(z.object({ householdId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deletedHousehold = await ctx.db.household.delete({
        where: {
          id: input.householdId,
        },
      })

      return deletedHousehold.id
    }),

  findBySearch: publicProcedure
    .input(
      z.object({
        searchText: z.string().min(2, { message: 'Search input should be minimum 2 characters' }),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.household.findMany({
        where: {
          OR: [
            {
              guests: {
                some: {
                  firstName: {
                    contains: input.searchText,
                    mode: 'insensitive',
                  },
                  AND: [
                    {
                      invitations: {
                        some: {
                          rsvp: {
                            in: ['Invited', 'Attending', 'Declined'],
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
            {
              guests: {
                some: {
                  lastName: {
                    contains: input.searchText,
                    mode: 'insensitive',
                  },
                  AND: [
                    {
                      invitations: {
                        some: {
                          rsvp: {
                            in: ['Invited', 'Attending', 'Declined'],
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
        select: {
          id: true,
          guests: {
            include: {
              invitations: true,
            },
          },
        },
      })
    }),
})
