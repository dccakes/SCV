import { createRouteHandler } from 'uploadthing/next'

import { uploadRouter } from '~/server/uploadthing/core'

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
})
