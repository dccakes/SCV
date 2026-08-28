import { NextResponse } from 'next/server'

import { householdInviteCookieName, householdInviteCookiePath } from '~/lib/website/cookies'
import { householdInviteService } from '~/server/application/household-invite'

type HouseholdInviteCodeRouteProps = {
  params: Promise<{
    websiteSubUrl: string
    code: string
  }>
}

const getInviteCookieMaxAge = (expiresAt: Date) =>
  Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))

export async function GET(request: Request, { params }: HouseholdInviteCodeRouteProps) {
  const { websiteSubUrl, code } = await params
  const inviteData = await householdInviteService.getInviteData(websiteSubUrl, code)

  const redirectUrl = new URL(`/w/${websiteSubUrl}/save-the-date`, request.url)
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

  response.cookies.set(householdInviteCookieName(websiteSubUrl), code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: householdInviteCookiePath(websiteSubUrl),
    maxAge: getInviteCookieMaxAge(inviteData.expiresAt),
  })

  return response
}
