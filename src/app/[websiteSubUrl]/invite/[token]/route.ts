import { NextResponse } from 'next/server'

import { householdInviteCookieName, householdInviteCookiePath } from '~/lib/website/cookies'
import { householdInviteService } from '~/server/application/household-invite'

type HouseholdInviteTokenRouteProps = {
  params: Promise<{
    websiteSubUrl: string
    token: string
  }>
}

const getInviteCookieMaxAge = (expiresAt: Date) =>
  Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))

export async function GET(request: Request, { params }: HouseholdInviteTokenRouteProps) {
  const { websiteSubUrl, token } = await params
  const inviteData = await householdInviteService.getInviteData(websiteSubUrl, token)

  const redirectUrl = new URL(`/${websiteSubUrl}/invite`, request.url)
  const response = NextResponse.redirect(redirectUrl)
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')

  if (!inviteData) {
    redirectUrl.searchParams.set('invalid', '1')
    return NextResponse.redirect(redirectUrl, {
      headers: {
        'X-Robots-Tag': 'noindex, nofollow',
      },
    })
  }

  response.cookies.set(householdInviteCookieName(websiteSubUrl), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: householdInviteCookiePath,
    maxAge: getInviteCookieMaxAge(inviteData.expiresAt),
  })

  return response
}
