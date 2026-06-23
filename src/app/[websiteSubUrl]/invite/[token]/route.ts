import { NextResponse } from 'next/server'

import { householdInviteService } from '~/server/application/household-invite'

type HouseholdInviteTokenRouteProps = {
  params: Promise<{
    websiteSubUrl: string
    token: string
  }>
}

const getCookieName = (websiteSubUrl: string) => `household_invite_${websiteSubUrl}`

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

  response.cookies.set(getCookieName(websiteSubUrl), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: `/${websiteSubUrl}`,
    maxAge: getInviteCookieMaxAge(inviteData.expiresAt),
  })

  return response
}
