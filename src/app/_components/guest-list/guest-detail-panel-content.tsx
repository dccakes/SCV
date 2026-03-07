import { type Dispatch, type SetStateAction, useMemo } from 'react'

import {
  GuestDetailSection,
  GuestDetailSections,
} from '~/app/_components/guest-list/v2/drawer/guest-detail-sections'
import type { Event } from '~/app/utils/shared-types'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import type { HouseholdWithGuests } from '~/server/application/dashboard/dashboard.types'

export type DrawerDraft = {
  email: string
  phone: string
  address1: string
  address2: string
  city: string
  state: string
  zipCode: string
  country: string
  notes: string
}

export type RsvpSummary = {
  attending: number
  invited: number
  declined: number
}

type SelectedEventResponse = {
  id: number
  name: string
  rsvp: string
}

type CommunicationLogItem = {
  type: 'sent'
  text: string
  date: Date
}

type GuestDetailPanelContentProps = {
  selectedHousehold: HouseholdWithGuests
  selectedEventId: string
  events: Event[]
  selectedEventResponses?: SelectedEventResponse[]
  communicationLog: CommunicationLogItem[]
  allEventRsvpSummary: Map<string, RsvpSummary>
  isDrawerEditMode: boolean
  setIsDrawerEditMode: Dispatch<SetStateAction<boolean>>
  drawerDraft: DrawerDraft
  setDrawerDraft: Dispatch<SetStateAction<DrawerDraft>>
}

export function GuestDetailPanelContent(props: Readonly<GuestDetailPanelContentProps>) {
  const {
    selectedHousehold,
    selectedEventId,
    events,
    selectedEventResponses,
    communicationLog,
    allEventRsvpSummary,
    isDrawerEditMode,
    setIsDrawerEditMode,
    drawerDraft,
    setDrawerDraft,
  } = props

  const primaryContact = useMemo(
    () => selectedHousehold.guests.find((guest) => guest.isPrimaryContact),
    [selectedHousehold]
  )

  const addressFields = useMemo(
    () => [
      selectedHousehold.address1,
      selectedHousehold.address2,
      selectedHousehold.city,
      selectedHousehold.state,
      selectedHousehold.zipCode,
      selectedHousehold.country,
    ],
    [selectedHousehold]
  )

  const updateDraft = <K extends keyof DrawerDraft>(key: K, value: DrawerDraft[K]) => {
    setDrawerDraft((draft) => ({ ...draft, [key]: value }))
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between border-border/70 border-b pb-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <span className='flex h-6 w-6 items-center justify-center rounded-full bg-success/12 font-mono text-[0.62rem] text-success'>
              {selectedEventResponses?.every((response) => response.rsvp === 'Attending')
                ? '✓'
                : selectedEventResponses?.some((response) => response.rsvp === 'Declined')
                  ? '✕'
                  : '…'}
            </span>
            <div>
              <p className='font-medium text-sm'>RSVP Status</p>
              <p className='font-mono text-[0.56rem] text-foreground/55 uppercase tracking-wider'>
                {selectedEventId === 'all' ? 'Across all invitations' : 'For selected event'}
              </p>
            </div>
          </div>
          <Button type='button' variant='ghost' size='sm' onClick={() => setIsDrawerEditMode(true)}>
            Change
          </Button>
        </div>
      </div>

      <GuestDetailSections>
        <GuestDetailSection title='Contact & Address' contentClassName='space-y-3'>
          {isDrawerEditMode ? (
            <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
              <label className='space-y-1'>
                <span className='font-mono text-[0.55rem] text-foreground/55 uppercase tracking-widest'>
                  Email
                </span>
                <input
                  name='email'
                  type='email'
                  autoComplete='email'
                  value={drawerDraft.email}
                  onChange={(event) => updateDraft('email', event.target.value)}
                  className='h-9 w-full rounded-md border border-border/70 bg-background px-2.5 text-sm'
                />
              </label>
              <label className='space-y-1'>
                <span className='font-mono text-[0.55rem] text-foreground/55 uppercase tracking-widest'>
                  Phone
                </span>
                <input
                  name='phone'
                  type='tel'
                  autoComplete='tel'
                  value={drawerDraft.phone}
                  onChange={(event) => updateDraft('phone', event.target.value)}
                  className='h-9 w-full rounded-md border border-border/70 bg-background px-2.5 text-sm'
                />
              </label>
              <label className='space-y-1 sm:col-span-2'>
                <span className='font-mono text-[0.55rem] text-foreground/55 uppercase tracking-widest'>
                  Address 1
                </span>
                <input
                  name='address1'
                  type='text'
                  autoComplete='address-line1'
                  value={drawerDraft.address1}
                  onChange={(event) => updateDraft('address1', event.target.value)}
                  className='h-9 w-full rounded-md border border-border/70 bg-background px-2.5 text-sm'
                />
              </label>
              <label className='space-y-1 sm:col-span-2'>
                <span className='font-mono text-[0.55rem] text-foreground/55 uppercase tracking-widest'>
                  Address 2
                </span>
                <input
                  name='address2'
                  type='text'
                  autoComplete='address-line2'
                  value={drawerDraft.address2}
                  onChange={(event) => updateDraft('address2', event.target.value)}
                  className='h-9 w-full rounded-md border border-border/70 bg-background px-2.5 text-sm'
                />
              </label>
              <label className='space-y-1'>
                <span className='font-mono text-[0.55rem] text-foreground/55 uppercase tracking-widest'>
                  City
                </span>
                <input
                  name='city'
                  type='text'
                  autoComplete='address-level2'
                  value={drawerDraft.city}
                  onChange={(event) => updateDraft('city', event.target.value)}
                  className='h-9 w-full rounded-md border border-border/70 bg-background px-2.5 text-sm'
                />
              </label>
              <label className='space-y-1'>
                <span className='font-mono text-[0.55rem] text-foreground/55 uppercase tracking-widest'>
                  State
                </span>
                <input
                  name='state'
                  type='text'
                  autoComplete='address-level1'
                  value={drawerDraft.state}
                  onChange={(event) => updateDraft('state', event.target.value)}
                  className='h-9 w-full rounded-md border border-border/70 bg-background px-2.5 text-sm'
                />
              </label>
              <label className='space-y-1'>
                <span className='font-mono text-[0.55rem] text-foreground/55 uppercase tracking-widest'>
                  Zip code
                </span>
                <input
                  name='zipCode'
                  type='text'
                  autoComplete='postal-code'
                  value={drawerDraft.zipCode}
                  onChange={(event) => updateDraft('zipCode', event.target.value)}
                  className='h-9 w-full rounded-md border border-border/70 bg-background px-2.5 text-sm'
                />
              </label>
              <label className='space-y-1'>
                <span className='font-mono text-[0.55rem] text-foreground/55 uppercase tracking-widest'>
                  Country
                </span>
                <input
                  name='country'
                  type='text'
                  autoComplete='country-name'
                  value={drawerDraft.country}
                  onChange={(event) => updateDraft('country', event.target.value)}
                  className='h-9 w-full rounded-md border border-border/70 bg-background px-2.5 text-sm'
                />
              </label>
            </div>
          ) : (
            <dl className='grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2'>
              <div>
                <dt className='font-mono text-[0.55rem] text-foreground/55 uppercase tracking-widest'>
                  Email
                </dt>
                <dd className='text-foreground/85'>{primaryContact?.email ?? 'Not provided'}</dd>
              </div>
              <div>
                <dt className='font-mono text-[0.55rem] text-foreground/55 uppercase tracking-widest'>
                  Phone
                </dt>
                <dd className='text-foreground/85'>{primaryContact?.phone ?? 'Not provided'}</dd>
              </div>
              <div className='sm:col-span-2'>
                <dt className='font-mono text-[0.55rem] text-foreground/55 uppercase tracking-widest'>
                  Address
                </dt>
                <dd className='text-foreground/85'>
                  {addressFields.filter((value): value is string => Boolean(value)).join(', ') ||
                    'Not provided'}
                </dd>
              </div>
            </dl>
          )}
        </GuestDetailSection>

        <GuestDetailSection title='Party Members' contentClassName='space-y-2'>
          <ul className='space-y-2'>
            {selectedHousehold.guests.map((guest) => (
              <li
                key={guest.id}
                className='flex items-center justify-between border-border/50 border-b py-2 last:border-b-0'
              >
                <div>
                  <span>
                    {guest.firstName} {guest.lastName}
                  </span>
                  <p className='font-mono text-[0.55rem] text-foreground/55 uppercase tracking-wider'>
                    {(guest.ageGroup ?? 'ADULT').toLowerCase()}
                  </p>
                </div>
                <div className='flex items-center gap-1.5'>
                  {guest.isPrimaryContact ? (
                    <Badge variant='secondary' className='text-[0.62rem]'>
                      Primary
                    </Badge>
                  ) : null}
                  {guest.isTagAlong && (
                    <Badge
                      variant='outline'
                      className='border-foreground/20 bg-foreground/[0.04] text-[0.62rem] text-foreground/60'
                    >
                      Tag-along
                    </Badge>
                  )}
                  {guest.invitations.length > 0 && (
                    <Badge
                      variant='outline'
                      className={
                        guest.invitations.some((invitation) => invitation.rsvp === 'Attending')
                          ? 'border-success/35 bg-success/12 text-success'
                          : guest.invitations.some((invitation) => invitation.rsvp === 'Declined')
                            ? 'border-destructive/30 bg-destructive/10 text-destructive'
                            : 'border-foreground/20 bg-accent/12 text-foreground/80'
                      }
                    >
                      {guest.invitations.find(
                        (invitation) => invitation.eventId === selectedEventId
                      )?.rsvp ?? 'Invited'}
                    </Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </GuestDetailSection>

        {selectedEventId === 'all' ? (
          <GuestDetailSection title='Seating & Event' contentClassName='space-y-2'>
            <ul className='space-y-2'>
              {events.map((event) => {
                const rsvpSummary = allEventRsvpSummary.get(event.id) ?? {
                  attending: 0,
                  invited: 0,
                  declined: 0,
                }

                return (
                  <li key={event.id} className='border-border/50 border-b py-2 last:border-b-0'>
                    <p className='mb-1 font-medium text-foreground text-sm'>{event.name}</p>
                    <div className='flex flex-wrap gap-1.5 text-xs'>
                      <Badge
                        variant='outline'
                        className='border-success/35 bg-success/12 text-success'
                      >
                        {rsvpSummary.attending} attending
                      </Badge>
                      <Badge
                        variant='outline'
                        className='border-foreground/20 bg-accent/12 text-foreground/80'
                      >
                        {rsvpSummary.invited} invited
                      </Badge>
                      <Badge
                        variant='outline'
                        className='border-destructive/30 bg-destructive/10 text-destructive'
                      >
                        {rsvpSummary.declined} declined
                      </Badge>
                    </div>
                  </li>
                )
              })}
            </ul>
          </GuestDetailSection>
        ) : (
          <GuestDetailSection title='Seating & Event' contentClassName='space-y-2'>
            <ul className='space-y-2'>
              {selectedEventResponses?.map((response) => (
                <li
                  key={response.id}
                  className='flex items-center justify-between border-border/50 border-b py-2 last:border-b-0'
                >
                  <span>{response.name}</span>
                  <Badge
                    variant='outline'
                    className={
                      response.rsvp === 'Attending'
                        ? 'border-success/35 bg-success/12 text-success'
                        : response.rsvp === 'Declined'
                          ? 'border-destructive/30 bg-destructive/10 text-destructive'
                          : 'border-foreground/20 bg-accent/12 text-foreground/80'
                    }
                  >
                    {response.rsvp}
                  </Badge>
                </li>
              ))}
            </ul>
          </GuestDetailSection>
        )}

        <GuestDetailSection title='Notes'>
          {isDrawerEditMode ? (
            <textarea
              name='notes'
              value={drawerDraft.notes}
              onChange={(event) => updateDraft('notes', event.target.value)}
              placeholder='No notes yet'
              className='min-h-[90px] w-full rounded-md border border-border/70 bg-background p-2.5 text-sm leading-relaxed'
            />
          ) : (
            <p className='text-foreground/85 leading-relaxed'>
              {selectedHousehold.notes ?? 'No notes yet'}
            </p>
          )}
        </GuestDetailSection>

        <GuestDetailSection title='Communication Log' contentClassName='space-y-2'>
          {communicationLog.length === 0 ? (
            <p className='text-foreground/55'>No communication activity yet.</p>
          ) : (
            <ul className='space-y-2'>
              {communicationLog.map((item, index) => (
                <li
                  key={`${item.text}-${item.date.toISOString()}-${index}`}
                  className='flex gap-2 border-border/50 border-b py-2 last:border-b-0'
                >
                  <span className='mt-1 h-1.5 w-1.5 rounded-full bg-success' />
                  <div>
                    <p className='text-sm'>{item.text}</p>
                    <p className='font-mono text-[0.55rem] text-foreground/55 uppercase tracking-wider'>
                      {item.date.toLocaleDateString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GuestDetailSection>
      </GuestDetailSections>
    </div>
  )
}
