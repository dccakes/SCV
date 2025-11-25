import { type Event as PrismaEvent, type Prisma } from '@prisma/client'
import { TRPCClientError } from '@trpc/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { calculateDaysRemaining, formatDateNumber } from '~/app/utils/helpers'
import { type User } from '~/app/utils/shared-types'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'

// Define input schemas to extract types
const submitRsvpInputSchema = z.object({
  rsvpResponses: z.array(
    z.object({
      eventId: z.string(),
      guestId: z.number(),
      rsvp: z.string(),
    })
  ),
  answersToQuestions: z.array(
    z.object({
      questionId: z.string(),
      questionType: z.string(),
      response: z.string(),
      guestId: z.number().nullish(),
      householdId: z.string().nullish(),
      selectedOptionId: z.string().optional(),
      guestFirstName: z.string().optional().nullish(),
      guestLastName: z.string().optional().nullish(),
    })
  ),
})

type SubmitRsvpInput = z.infer<typeof submitRsvpInputSchema>
type RsvpResponse = SubmitRsvpInput['rsvpResponses'][number]
type AnswerToQuestion = SubmitRsvpInput['answersToQuestions'][number]

export const websiteRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        firstName: z.string(),
        lastName: z.string(),
        partnerFirstName: z.string(),
        partnerLastName: z.string(),
        basePath: z.string(),
        email: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.auth.userId

      // TODO: needa check for dupes
      const { firstName, lastName, partnerFirstName, partnerLastName, basePath, email } = input

      const subUrl = `${firstName}${lastName}and${partnerFirstName}${partnerLastName}`.toLowerCase()
      const url = `${basePath}/${subUrl}`

      await ctx.db.event.create({
        data: {
          name: 'Wedding Day',
          userId,
          collectRsvp: true,
        },
      })

      await ctx.db.user.create({
        data: {
          id: userId,
          websiteUrl: url,
          email,
          groomFirstName: firstName,
          groomLastName: lastName,
          brideFirstName: partnerFirstName,
          brideLastName: partnerLastName,
        },
      })

      return ctx.db.website.create({
        data: {
          userId,
          url,
          subUrl,
          groomFirstName: firstName,
          groomLastName: lastName,
          brideFirstName: partnerFirstName,
          brideLastName: partnerLastName,
          generalQuestions: {
            create: [
              {
                text: 'Will you be bringing any children under the age of 10?',
                type: 'Text',
              },
              {
                text: 'Send a note to the couple?',
                type: 'Text',
              },
            ],
          },
        },
      })
    }),

  update: protectedProcedure
    .input(
      z.object({
        isPasswordEnabled: z.boolean().optional(),
        password: z.string().optional(),
        basePath: z.string().optional(),
        subUrl: z
          .string()
          .regex(new RegExp(/^\w+$/), 'Url should not contain any special characters!')
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const url = input.subUrl !== undefined ? `${input.basePath}/${input.subUrl}` : undefined

      await ctx.db.user.update({
        where: {
          id: ctx.auth.userId,
        },
        data: {
          websiteUrl: url,
        },
      })

      return await ctx.db.website.update({
        where: {
          userId: ctx.auth.userId,
        },
        data: {
          isPasswordEnabled: input.isPasswordEnabled ?? undefined,
          password: input.password ?? undefined,
          subUrl: input.subUrl,
          url,
        },
      })
    }),

  updateIsRsvpEnabled: protectedProcedure
    .input(
      z.object({
        websiteId: z.string(),
        isRsvpEnabled: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.website.update({
        where: {
          id: input.websiteId,
        },
        data: {
          isRsvpEnabled: input.isRsvpEnabled,
        },
      })
    }),

  updateCoverPhoto: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        coverPhotoUrl: z.string().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.website.update({
        where: {
          userId: input.userId,
        },
        data: {
          coverPhotoUrl: input.coverPhotoUrl,
        },
      })
    }),

  getByUserId: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.auth) return
    return ctx.db.website.findFirst({
      where: {
        userId: ctx.auth.userId ?? '',
      },
    })
  }),

  getBySubUrl: publicProcedure
    .input(z.object({ subUrl: z.string().nullish() }))
    .query(async ({ ctx, input }) => {
      if (input.subUrl === undefined) return null
      return await ctx.db.website.findFirst({
        where: {
          subUrl: input.subUrl ?? '',
        },
      })
    }),

  fetchWeddingData: publicProcedure
    .input(z.object({ subUrl: z.string() }))
    .query(async ({ ctx, input }) => {
      const website = await ctx.db.website.findFirst({
        where: {
          subUrl: input.subUrl,
        },
        include: {
          generalQuestions: {
            orderBy: {
              createdAt: 'asc',
            },
            include: {
              options: true,
              _count: {
                select: {
                  answers: true,
                },
              },
            },
          },
        },
      })

      if (website === null) {
        throw new TRPCClientError('This website does not exist.')
      }

      const weddingUser: User | null = await ctx.db.user.findFirst({
        where: {
          id: website.userId,
        },
      })

      if (!weddingUser) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch wedding website data.',
        })
      }

      const events = await ctx.db.event.findMany({
        where: {
          userId: website.userId,
        },
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          questions: {
            orderBy: {
              createdAt: 'asc',
            },
            include: {
              options: true,
              _count: {
                select: {
                  answers: true,
                },
              },
            },
          },
        },
      })

      const weddingDate = events.find((event: PrismaEvent) => event.name === 'Wedding Day')?.date

      const weddingData = {
        groomFirstName: weddingUser.groomFirstName,
        groomLastName: weddingUser.groomLastName,
        brideFirstName: weddingUser.brideFirstName,
        brideLastName: weddingUser.brideLastName,
        date: {
          standardFormat: weddingDate?.toLocaleDateString('en-us', {
            weekday: 'long',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          numberFormat: formatDateNumber(weddingDate),
        },
        website,
        daysRemaining: calculateDaysRemaining(weddingDate) ?? -1,
        events,
      }

      return weddingData
    }),

  submitRsvpForm: protectedProcedure
    .input(submitRsvpInputSchema)
    .mutation(async ({ input, ctx }) => {
      await ctx.db.$transaction(async (prisma: Prisma.TransactionClient) => {
        await Promise.all(
          input.rsvpResponses.map(async (response: RsvpResponse) => {
            await prisma.invitation.update({
              where: {
                invitationId: {
                  guestId: response.guestId,
                  eventId: response.eventId,
                },
              },
              data: { rsvp: response.rsvp },
            })
          })
        )
        await Promise.all(
          input.answersToQuestions.map(async (answer: AnswerToQuestion) => {
            if (answer.questionType === 'Option') {
              const optionResponse = await prisma.optionResponse.findFirst({
                where: {
                  AND: [
                    { questionId: answer.questionId ?? '-1' },
                    {
                      OR: [
                        { guestId: answer.guestId ?? -1 },
                        { householdId: answer.householdId ?? '-1' },
                      ],
                    },
                  ],
                },
              })
              if (optionResponse === null) {
                await prisma.optionResponse.create({
                  data: {
                    questionId: answer.questionId,
                    optionId: answer.response,
                    guestId: answer.guestId ?? -1,
                    guestFirstName: answer.guestFirstName,
                    guestLastName: answer.guestLastName,
                    householdId: answer.householdId ?? '-1',
                  },
                })
                await prisma.option.update({
                  where: { id: answer.response },
                  data: {
                    responseCount: { increment: 1 },
                  },
                })
                // only update if user's previous selected option is different from currently selected one
              } else if (optionResponse.optionId !== answer.response) {
                await prisma.optionResponse.update({
                  where: {
                    optionResponseId: {
                      questionId: answer.questionId ?? '-1',
                      guestId: answer.guestId ?? -1,
                      householdId: answer.householdId ?? '-1',
                    },
                  },
                  data: { optionId: answer.response },
                })
                await prisma.option.update({
                  where: { id: optionResponse.optionId },
                  data: {
                    responseCount: { decrement: 1 },
                  },
                })
                await prisma.option.update({
                  where: { id: answer.response },
                  data: {
                    responseCount: { increment: 1 },
                  },
                })
              }
            } else {
              await prisma.answer.upsert({
                where: {
                  answerId: {
                    questionId: answer.questionId,
                    guestId: answer.guestId ?? -1,
                    householdId: answer.householdId ?? '-1',
                  },
                },
                update: { response: answer.response },
                create: {
                  response: answer.response,
                  questionId: answer.questionId,
                  guestId: answer.guestId ?? -1,
                  guestFirstName: answer.guestFirstName,
                  guestLastName: answer.guestLastName,
                  householdId: answer.householdId ?? '-1',
                },
              })
            }
          })
        )
      })
    }),
})
