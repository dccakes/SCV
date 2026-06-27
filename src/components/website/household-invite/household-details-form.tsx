'use client'

import Link from 'next/link'
import { useState } from 'react'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { PhoneInput } from '~/components/ui/phone-input'
import { HouseholdSubmitButton } from '~/components/website/household-invite/household-submit-button'
import type { HouseholdInviteData } from '~/server/application/household-invite/household-invite.service'

type HouseholdDetailsFormProps = {
  inviteData: HouseholdInviteData
  action: (formData: FormData) => Promise<void>
  errorMessage?: string | null
  inviteHref: string
}

const valueOrEmpty = (value: string | null) => value ?? ''

export function HouseholdDetailsForm({
  inviteData,
  action,
  errorMessage,
  inviteHref,
}: HouseholdDetailsFormProps) {
  const [phones, setPhones] = useState<Record<number, string>>(() =>
    Object.fromEntries(inviteData.guests.map((guest) => [guest.id, valueOrEmpty(guest.phone)]))
  )

  return (
    <form action={action} className='mt-10 space-y-10'>
      {errorMessage ? (
        <p className='border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive text-sm'>
          {errorMessage}
        </p>
      ) : null}

      <section className='space-y-5'>
        <h2 className='font-mono text-muted-foreground text-xs uppercase tracking-[0.22em]'>
          Household members
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
                  <Label htmlFor={`guest-${guest.id}-firstName`}>First name</Label>
                  <Input
                    id={`guest-${guest.id}-firstName`}
                    name={`guest-${guest.id}-firstName`}
                    defaultValue={guest.firstName}
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor={`guest-${guest.id}-lastName`}>Last name</Label>
                  <Input
                    id={`guest-${guest.id}-lastName`}
                    name={`guest-${guest.id}-lastName`}
                    defaultValue={guest.lastName}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor={`guest-${guest.id}-email`}>Email</Label>
                  <Input
                    id={`guest-${guest.id}-email`}
                    name={`guest-${guest.id}-email`}
                    type='email'
                    defaultValue={valueOrEmpty(guest.email)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor={`guest-${guest.id}-phone`}>Phone</Label>
                  <input
                    type='hidden'
                    name={`guest-${guest.id}-phone`}
                    value={phones[guest.id] ?? ''}
                  />
                  <PhoneInput
                    id={`guest-${guest.id}-phone`}
                    value={phones[guest.id] || undefined}
                    onChange={(nextValue) =>
                      setPhones((current) => ({ ...current, [guest.id]: nextValue ?? '' }))
                    }
                    className='w-full'
                  />
                </div>
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      <section className='space-y-5'>
        <h2 className='font-mono text-muted-foreground text-xs uppercase tracking-[0.22em]'>
          Mailing address
        </h2>

        <div className='grid gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='address1'>Street address</Label>
            <Input
              id='address1'
              name='address1'
              defaultValue={valueOrEmpty(inviteData.household.address1)}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='address2'>Apt, suite, or other</Label>
            <Input
              id='address2'
              name='address2'
              defaultValue={valueOrEmpty(inviteData.household.address2)}
            />
          </div>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='city'>City</Label>
              <Input id='city' name='city' defaultValue={valueOrEmpty(inviteData.household.city)} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='state'>State / province</Label>
              <Input
                id='state'
                name='state'
                defaultValue={valueOrEmpty(inviteData.household.state)}
              />
            </div>
          </div>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='zipCode'>Postal code</Label>
              <Input
                id='zipCode'
                name='zipCode'
                defaultValue={valueOrEmpty(inviteData.household.zipCode)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='country'>Country</Label>
              <Input
                id='country'
                name='country'
                defaultValue={valueOrEmpty(inviteData.household.country)}
              />
            </div>
          </div>
        </div>
      </section>

      <p className='max-w-xl text-muted-foreground text-sm leading-6'>
        These details are only used by the couple to prepare future physical invitations for this
        household.
      </p>

      <div className='flex flex-wrap items-center gap-3'>
        <HouseholdSubmitButton />
        <Button asChild type='button' variant='outline'>
          <Link href={inviteHref}>Back to save the date</Link>
        </Button>
      </div>
    </form>
  )
}
