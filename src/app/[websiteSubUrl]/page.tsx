import { type Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import PasswordPage from '~/app/_components/website/password-page'
import WeddingWebsite from '~/app/_components/website/wedding'
import { api } from '~/trpc/server'

export async function generateMetadata(): Promise<Metadata> {
  const user = await api.user.get.query()
  return {
    title: `${user?.groomFirstName} ${user?.groomLastName} and ${user?.brideFirstName} ${user?.brideLastName}'s Wedding Website`,
  }
}

type RootRouteHandlerProps = {
  params: Promise<{
    websiteSubUrl: string
  }>
}

export default async function RootRouteHandler({ params }: RootRouteHandlerProps) {
  const { websiteSubUrl } = await params
  const website = await api.website.getBySubUrl.query({
    subUrl: websiteSubUrl,
  })

  if (website === null) return notFound()
  if (!website.isPasswordEnabled) return <WeddingWebsite />

  const cookieStore = await cookies()
  const hasPassword = cookieStore.get('wws_password')?.value === website.password

  const setPasswordCookie = async (value: string) => {
    'use server'
    const cookieStore = await cookies()
    cookieStore.set('wws_password', value)
  }

  return (
    <main>
      {hasPassword ? (
        <WeddingWebsite />
      ) : (
        <PasswordPage website={website} setPasswordCookie={setPasswordCookie} />
      )}
    </main>
  )
}
