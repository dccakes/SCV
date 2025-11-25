import { z } from 'zod'

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
// const _s3Config = {
//   region: process.env.AWS_S3_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID!,
//     secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!,
//   },
// }
export const uploadRouter = createTRPCRouter({
  getByUserId: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.auth) return
    return ctx.db.website.findFirst({
      where: {
        userId: ctx.auth.userId ?? '',
      },
    })
  }),
  uploadFile: protectedProcedure.input(z.object({})).mutation(async () => {
    // const formData = await request.formData();
    // const files = formData.getAll("file") as File[];
    // const response = await Promise.all(
    //   files.map(async (file: any) => {
    //     const Body = (await file.arrayBuffer()) as Buffer;
    //     await s3.send(new PutObjectCommand({ Bucket, Key: file.name, Body }));
    //   }),
    // );
    // return NextResponse.json(response);
  }),
})
