import { type HandleUploadBody, handleUpload } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { ANALYTICS_ACTIONS, ANALYTICS_SCOPES, buildEventName } from '~/lib/analytics/events'
import { auth } from '~/lib/auth'
import { ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE } from '~/lib/upload-config'
import { captureServerEvent } from '~/server/infrastructure/analytics/capture'

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

        captureServerEvent({
          event: buildEventName({
            scope: ANALYTICS_SCOPES.asset,
            object: 'upload_token',
            action: ANALYTICS_ACTIONS.generated,
          }),
          context: {
            distinctId: session.user.id,
            isAuthenticated: true,
            userId: session.user.id,
          },
          properties: {
            allowed_content_types: ALLOWED_CONTENT_TYPES,
            max_file_size: MAX_FILE_SIZE,
          },
        })

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
