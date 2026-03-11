import { createUploadthing, type FileRouter } from 'uploadthing/server'

import { auth } from '~/lib/auth'

const f = createUploadthing()

export const uploadRouter = {
  vendorQuoteFile: f({
    pdf: { maxFileSize: '8MB', maxFileCount: 10 },
    image: { maxFileSize: '8MB', maxFileCount: 10 },
    text: { maxFileSize: '8MB', maxFileCount: 10 },
    'application/msword': { maxFileSize: '8MB', maxFileCount: 10 },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      maxFileSize: '8MB',
      maxFileCount: 10,
    },
    'application/vnd.ms-excel': { maxFileSize: '8MB', maxFileCount: 10 },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
      maxFileSize: '8MB',
      maxFileCount: 10,
    },
  })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({
        headers: req.headers,
      })

      if (!session?.user?.id) {
        throw new Error('Unauthorized')
      }

      return { userId: session.user.id }
    })
    .onUploadComplete(({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl, key: file.key, name: file.name, size: file.size }
    }),
} satisfies FileRouter

export type UploadRouter = typeof uploadRouter
