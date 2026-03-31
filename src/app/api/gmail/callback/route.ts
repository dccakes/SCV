/**
 * Gmail OAuth Callback Route
 *
 * Google redirects the browser here after the user authorizes Gmail access.
 * Extracts the code + state, validates the userId from state, exchanges
 * the code for tokens, and redirects back to Settings.
 */

import { NextResponse, type NextRequest } from 'next/server'

import { auth } from '~/lib/auth'
import { gmailService } from '~/server/domains/gmail'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const baseUrl = request.nextUrl.origin

  // User denied access
  if (error) {
    return NextResponse.redirect(`${baseUrl}/settings?tab=connections&gmail=denied`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/settings?tab=connections&gmail=error`)
  }

  try {
    // Validate the state contains a userId
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString('utf-8')) as {
      userId: string
      nonce: string
    }

    if (!stateData.userId) {
      return NextResponse.redirect(`${baseUrl}/settings?tab=connections&gmail=error`)
    }

    // Verify the current session matches the state userId (CSRF protection)
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user?.id || session.user.id !== stateData.userId) {
      return NextResponse.redirect(`${baseUrl}/settings?tab=connections&gmail=error`)
    }

    await gmailService.handleCallback(stateData.userId, code)

    return NextResponse.redirect(`${baseUrl}/settings?tab=connections&gmail=connected`)
  } catch {
    return NextResponse.redirect(`${baseUrl}/settings?tab=connections&gmail=error`)
  }
}
