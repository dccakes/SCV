import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { calculateDaysRemaining, formatDateNumber } from "~/app/utils/helpers";

import {
  type Event,
  type Guest,
  type Household,
  type Invitation,
  type Question,
  type User,
} from "~/app/utils/shared-types";

export const dashboardRouter = createTRPCRouter({
  getByUserId: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.userId) return null;

    const households = await ctx.db.household.findMany({
      where: {
        userId: ctx.auth.userId,
      },
      select: {
        guests: {
          orderBy: {
            firstName: "asc",
          },
        },
        id: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        phone: true,
        email: true,
        notes: true,
        gifts: {
          include: {
            event: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const invitations = await ctx.db.invitation.findMany({
      where: {
        userId: ctx.auth.userId,
      },
    });

    const events = await ctx.db.event.findMany({
      where: {
        userId: ctx.auth.userId,
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        questions: {
          orderBy: {
            createdAt: "asc",
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
    });

    const currentUser: User | null = await ctx.db.user.findFirst({
      where: {
        id: ctx.auth.userId,
      },
    });

    const website = await ctx.db.website.findFirst({
      where: {
        userId: ctx.auth.userId,
      },
      include: {
        generalQuestions: {
          orderBy: {
            createdAt: "asc",
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
    });

    if (!currentUser || !website) return null;

    const weddingDate = events.find(
      (event: Event) => event.name === "Wedding Day",
    )?.date;

    const weddingData = {
      website: {
        ...website,
        generalQuestions: await Promise.all(
          website.generalQuestions.map(async (question: Question) => {
            return {
              ...question,
              recentAnswer: await ctx.db.answer.findFirst({
                where: {
                  questionId: question.id,
                },
                orderBy: {
                  createdAt: "desc",
                },
                take: 1,
                // select: {
                //   guest: {
                //     select: {
                //       firstName: true,
                //       lastName: true,
                //     }
                //   }
                // }
              }),
            };
          }),
        ),
      },
      groomFirstName: currentUser.groomFirstName,
      groomLastName: currentUser.groomLastName,
      brideFirstName: currentUser.brideFirstName,
      brideLastName: currentUser.brideLastName,
      date: {
        standardFormat: weddingDate?.toLocaleDateString("en-us", {
          weekday: "long",
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        numberFormat: formatDateNumber(weddingDate),
      },
      daysRemaining: calculateDaysRemaining(weddingDate) ?? -1,
    };

    const dashboardData = {
      weddingData,
      totalGuests: await ctx.db.guest.count({
        where: {
          userId: ctx.auth.userId,
        },
      }),
      totalEvents: events.length,
      households: households.map((household: Household) => {
        return {
          ...household,
          guests: household.guests.map((guest: Guest) => {
            return {
              ...guest,
              invitations: invitations.reduce(
                (acc: Invitation[], invitation: any) => {
                  if (guest.id === invitation.guestId) {
                    acc.push({
                      eventId: invitation.eventId,
                      rsvp: invitation.rsvp,
                    });
                  }
                  return acc;
                },
                [],
              ),
            };
          }),
        };
      }),

      events: await Promise.all(
        events.map(async (event: Event) => {
          const guestResponses = {
            invited: 0,
            attending: 0,
            declined: 0,
            notInvited: 0,
          };

          invitations.forEach((rsvp: any) => {
            if (event.id === rsvp.eventId) {
              switch (rsvp.rsvp) {
                case "Invited":
                  guestResponses.invited += 1;
                  break;
                case "Attending":
                  guestResponses.attending += 1;
                  break;
                case "Declined":
                  guestResponses.declined += 1;
                  break;
                default:
                  guestResponses.notInvited += 1;
                  break;
              }
            }
          });

          return {
            ...event,
            questions: await Promise.all(
              event.questions.map(async (question: any) => {
                return {
                  ...question,
                  recentAnswer: await ctx.db.answer.findFirst({
                    where: {
                      questionId: question.id,
                    },
                    orderBy: {
                      createdAt: "desc",
                    },
                    take: 1,
                  }),
                };
              }),
            ),
            guestResponses,
          };
        }),
      ),
    };

    return dashboardData;
  }),
});
