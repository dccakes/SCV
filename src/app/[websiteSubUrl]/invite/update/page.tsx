import { TRPCError } from '@trpc/server'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { HouseholdDetailsForm } from '~/components/website/household-invite/household-details-form'
import { InvalidHouseholdInvite } from '~/components/website/household-invite/invalid-household-invite'
import { householdInviteCookieName } from '~/lib/website/cookies'
import { householdInviteService } from '~/server/application/household-invite'
import type { UpdateHouseholdInviteInput } from '~/server/application/household-invite/household-invite.service'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

type HouseholdInviteUpdatePageProps = {
  params: Promise<{
    websiteSubUrl: string
  }>
  searchParams?: Promise<{
    error?: string
  }>
}

const stringValue = (formData: FormData, key: string) => {
  const value = formData.get(key)
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const parseUpdateFormData = (formData: FormData): UpdateHouseholdInviteInput => {
  const guestIds = formData
    .getAll('guestId')
    .filter((value): value is string => typeof value === 'string')

  return {
    address1: stringValue(formData, 'address1'),
    address2: stringValue(formData, 'address2'),
    city: stringValue(formData, 'city'),
    state: stringValue(formData, 'state'),
    zipCode: stringValue(formData, 'zipCode'),
    country: stringValue(formData, 'country'),
    guests: guestIds.map((guestId) => ({
      guestId: Number(guestId),
      firstName: stringValue(formData, `guest-${guestId}-firstName`) ?? '',
      lastName: stringValue(formData, `guest-${guestId}-lastName`) ?? '',
      email: stringValue(formData, `guest-${guestId}-email`),
      phone: stringValue(formData, `guest-${guestId}-phone`),
    })),
  }
}

const getErrorMessage = (errorCode: string | undefined) => {
  if (errorCode === 'validation') {
    return 'Please check the highlighted details and try again. Each person needs a first name, and emails must be valid and unique.'
  }

  if (errorCode === 'expired') {
    return 'This invite link has expired or could not be verified. Please ask the couple for a fresh link.'
  }

  if (errorCode === 'save') {
    return 'We could not save those details. Please try again in a moment.'
  }

  return null
}

export default async function HouseholdInviteUpdatePage({
  params,
  searchParams,
}: HouseholdInviteUpdatePageProps) {
  const { websiteSubUrl } = await params
  const resolvedSearchParams = await searchParams
  const cookieStore = await cookies()
  const token = cookieStore.get(householdInviteCookieName(websiteSubUrl))?.value
  const inviteData = await householdInviteService.getInviteData(websiteSubUrl, token)

  if (!inviteData) return <InvalidHouseholdInvite websiteSubUrl={websiteSubUrl} />

  const updateHouseholdDetails = async (formData: FormData) => {
    'use server'

    const cookieStore = await cookies()
    const token = cookieStore.get(householdInviteCookieName(websiteSubUrl))?.value
    try {
      await householdInviteService.updateHouseholdDetails(
        websiteSubUrl,
        token,
        parseUpdateFormData(formData)
      )
    } catch (error) {
      if (error instanceof TRPCError && error.code === 'FORBIDDEN') {
        redirect(`/${websiteSubUrl}/invite/update?error=expired`)
      }

      if (error instanceof TRPCError && ['BAD_REQUEST', 'CONFLICT'].includes(error.code)) {
        redirect(`/${websiteSubUrl}/invite/update?error=validation`)
      }

      redirect(`/${websiteSubUrl}/invite/update?error=save`)
    }
    redirect(`/${websiteSubUrl}/invite?updated=1`)
  }

  return (
    <main className='min-h-screen bg-background px-5 py-10 text-foreground'>
      <section className='mx-auto w-full max-w-3xl'>
        <p className='mb-3 font-mono text-muted-foreground text-xs uppercase tracking-[0.28em]'>
          Save the date
        </p>
        <h1 className='font-display text-5xl italic leading-none'>Update our details</h1>
        <p className='mt-5 max-w-xl font-sans text-muted-foreground leading-7'>
          Please confirm the names and mailing address we should use for future physical
          invitations.
        </p>

        <HouseholdDetailsForm
          inviteData={inviteData}
          action={updateHouseholdDetails}
          errorMessage={getErrorMessage(resolvedSearchParams?.error)}
          inviteHref={`/${websiteSubUrl}/invite`}
        />
      </section>
    </main>
  )
}
