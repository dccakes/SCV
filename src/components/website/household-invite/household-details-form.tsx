import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { HouseholdSubmitButton } from '~/components/website/household-invite/household-submit-button'
import type { HouseholdInviteData } from '~/server/application/household-invite/household-invite.service'

type HouseholdDetailsFormProps = {
  inviteData: HouseholdInviteData
  action: (formData: FormData) => Promise<void>
  errorMessage?: string | null
  inviteHref: string
}

const valueOrEmpty = (value: string | null) => value ?? ''

export async function HouseholdDetailsForm({
  inviteData,
  action,
  errorMessage,
  inviteHref,
}: Readonly<HouseholdDetailsFormProps>) {
  const t = await getTranslations('household')
  return (
    <form action={action} className='mt-10 space-y-10'>
      {errorMessage ? (
        <p className='border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive text-sm'>
          {errorMessage}
        </p>
      ) : null}

      <section className='space-y-5'>
        <h2 className='font-mono text-muted-foreground text-xs uppercase tracking-[0.22em]'>
          {t('members')}
        </h2>

        <div className='space-y-6'>
          {inviteData.guests.map((guest) => (
            <fieldset key={guest.id} className='border border-border p-5'>
              <input type='hidden' name='guestId' value={guest.id} />
              <legend className='px-2 font-serif text-lg'>
                {[guest.firstName, guest.lastName].filter(Boolean).join(' ')}
              </legend>

              <div className='mt-4 grid gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor={`guest-${guest.id}-firstName`}>{t('firstName')}</Label>
                  <Input
                    id={`guest-${guest.id}-firstName`}
                    name={`guest-${guest.id}-firstName`}
                    defaultValue={guest.firstName}
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor={`guest-${guest.id}-lastName`}>{t('lastName')}</Label>
                  <Input
                    id={`guest-${guest.id}-lastName`}
                    name={`guest-${guest.id}-lastName`}
                    defaultValue={guest.lastName}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor={`guest-${guest.id}-email`}>{t('email')}</Label>
                  <Input
                    id={`guest-${guest.id}-email`}
                    name={`guest-${guest.id}-email`}
                    type='email'
                    defaultValue={valueOrEmpty(guest.email)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor={`guest-${guest.id}-phone`}>{t('phone')}</Label>
                  <Input
                    id={`guest-${guest.id}-phone`}
                    name={`guest-${guest.id}-phone`}
                    defaultValue={valueOrEmpty(guest.phone)}
                  />
                </div>
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      <section className='space-y-5'>
        <h2 className='font-mono text-muted-foreground text-xs uppercase tracking-[0.22em]'>
          {t('mailingAddress')}
        </h2>

        <div className='grid gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='address1'>{t('streetAddress')}</Label>
            <Input
              id='address1'
              name='address1'
              defaultValue={valueOrEmpty(inviteData.household.address1)}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='address2'>{t('aptSuite')}</Label>
            <Input
              id='address2'
              name='address2'
              defaultValue={valueOrEmpty(inviteData.household.address2)}
            />
          </div>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='city'>{t('city')}</Label>
              <Input id='city' name='city' defaultValue={valueOrEmpty(inviteData.household.city)} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='state'>{t('stateProvince')}</Label>
              <Input
                id='state'
                name='state'
                defaultValue={valueOrEmpty(inviteData.household.state)}
              />
            </div>
          </div>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='zipCode'>{t('postalCode')}</Label>
              <Input
                id='zipCode'
                name='zipCode'
                defaultValue={valueOrEmpty(inviteData.household.zipCode)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='country'>{t('country')}</Label>
              <Input
                id='country'
                name='country'
                defaultValue={valueOrEmpty(inviteData.household.country)}
              />
            </div>
          </div>
        </div>
      </section>

      <p className='max-w-xl text-muted-foreground text-sm leading-6'>{t('privacyNote')}</p>

      <div className='flex flex-wrap items-center gap-3'>
        <HouseholdSubmitButton />
        <Button asChild type='button' variant='outline'>
          <Link href={inviteHref}>{t('backToSaveTheDate')}</Link>
        </Button>
      </div>
    </form>
  )
}
