import { type Guest as PrismaGuest } from '@prisma/client'
import { z } from 'zod'

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'

export const eventRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        eventName: z.string().min(1, { message: 'Event name required' }),
        date: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        venue: z.string().optional(),
        attire: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { eventName: name, date, startTime, endTime, venue, attire, description } = input
      const userId = ctx.auth.userId

      const newEvent = await ctx.db.event.create({
        data: {
          name,
          userId,
          date: date ? new Date(date) : undefined,
          startTime,
          endTime,
          venue,
          attire,
          description,
        },
      })

      // create invitations for all pre-existing guests to relate to this new event being created
      const guests = await ctx.db.guest.findMany({
        where: {
          userId,
        },
      })

      await Promise.all(
        guests.map(async (guest: PrismaGuest) => {
          await ctx.db.invitation.create({
            data: {
              userId,
              guestId: guest.id,
              eventId: newEvent.id,
              rsvp: 'Not Invited',
            },
          })
        })
      )

      return newEvent
    }),

  getAllByUserId: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.userId) return
    return await ctx.db.event.findMany({
      where: {
        userId: ctx.auth.userId,
      },
    })
  }),

  update: protectedProcedure
    .input(
      z.object({
        eventName: z.string().min(1, { message: 'Event name required' }),
        date: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        venue: z.string().optional(),
        attire: z.string().optional(),
        description: z.string().optional(),
        eventId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.event.update({
        where: {
          id: input.eventId,
        },
        data: {
          name: input.eventName,
          date: input.date ? new Date(input.date) : undefined,
          startTime: input.startTime,
          endTime: input.endTime,
          venue: input.venue,
          attire: input.attire,
          description: input.description,
        },
      })
    }),

  updateCollectRsvp: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        collectRsvp: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.event.update({
        where: {
          id: input.eventId,
        },
        data: {
          collectRsvp: input.collectRsvp,
        },
      })
    }),

  delete: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const deletedEvent = await ctx.db.event.delete({
        where: {
          id: input.eventId,
        },
      })

      return deletedEvent.id
    }),
})
