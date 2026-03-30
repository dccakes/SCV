import { type HandleUploadBody, handleUpload } from '@vercel/blob/client'
import { NextResponse } from 'next/server'

import { auth } from '~/lib/auth'
import { ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE } from '~/lib/upload-config'

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await auth.api.getSession({
          headers: request.headers,
        })

        if (!session?.user?.id) {
          throw new Error('Unauthorized')
        }

        return {
          allowedContentTypes: [...ALLOWED_CONTENT_TYPES],
          maximumSizeInBytes: MAX_FILE_SIZE,
          tokenPayload: JSON.stringify({ userId: session.user.id }),
        }
      },
      onUploadCompleted: async () => {
        // Metadata saving is handled separately via tRPC saveQuoteFiles mutation.
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    const message = (error as Error).message
    const isAuthError = message === 'Unauthorized'
    return NextResponse.json(
      { error: isAuthError ? 'Unauthorized' : 'Upload failed' },
      { status: isAuthError ? 401 : 400 }
    )
  }
}
