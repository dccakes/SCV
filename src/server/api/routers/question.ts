/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const questionRouter = createTRPCRouter({
  upsert: protectedProcedure
    .input(
      z.object({
        questionId: z.string().optional(),
        websiteId: z.string().optional().nullish(),
        eventId: z.string().optional().nullish(),
        text: z
          .string()
          .min(1, { message: "Question prompt should not be empty!" }),
        type: z.string(),
        isRequired: z.boolean().default(false),
        options: z
          .array(
            z.object({
              id: z.string().optional(),
              questionId: z.string().optional(),
              responseCount: z.number().optional(),
              text: z
                .string()
                .min(1, { message: "Option should not be empty!" }),
              description: z.string().optional(),
            }),
          )
          .min(2, {
            message: "You need to have at least two options for this question!",
          })
          .optional(),
        deletedOptions: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (input.deletedOptions && input.deletedOptions.length > 0) {
        await ctx.db.option.deleteMany({
          where: {
            id: {
              in: input.deletedOptions,
            },
          },
        });
      }

      const upsertOptions = {
        upsert: input.options?.map((option: any) => {
          return {
            where: {
              id: option.id ?? "-1",
            },
            update: {
              text: option.text ?? undefined,
              description: option.description ?? undefined,
            },
            create: {
              text: option.text,
              description: option.description ?? "",
              responseCount: 0,
            },
          };
        }),
      };

      const createOptions = {
        create: input?.options?.map((option: any) => {
          return {
            text: option.text,
            description: option.description ?? "",
            responseCount: 0,
          };
        }),
      };

      return await ctx.db.question.upsert({
        where: {
          id: input.questionId ?? "-1",
        },
        update: {
          text: input.text,
          type: input.type,
          isRequired: input.isRequired,
          options: input.type === "Option" ? upsertOptions : undefined,
        },
        create: {
          eventId: input.eventId ?? undefined,
          websiteId: input.websiteId ?? undefined,
          text: input.text,
          type: input.type,
          isRequired: input.isRequired,
          options: input.type === "Option" ? createOptions : undefined,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ questionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // TODO: delete answers / optionResponses as well while updating the respective counts in Options table
      return await ctx.db.question.delete({
        where: {
          id: input.questionId,
        },
      });
    }),
});
