import { generateReactHelpers } from '@uploadthing/react'

import type { UploadRouter } from '~/server/uploadthing/core'

export const { useUploadThing } = generateReactHelpers<UploadRouter>()
