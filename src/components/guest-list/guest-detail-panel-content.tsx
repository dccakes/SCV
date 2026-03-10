import Link from 'next/link'
import { type Dispatch, type SetStateAction, useMemo, useState } from 'react'
import type { Event } from '~/app/utils/shared-types'
import {
  type HouseholdMemberDraft,
  HouseholdMembersModal,
} from '~/components/guest-list/household-members-modal'
import {
  GuestDetailSection,
  GuestDetailSections,
} from '~/components/guest-list/v2/drawer/guest-detail-sections'
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

type DraftUpdater = <K extends keyof DrawerDraft>(key: K, value: DrawerDraft[K]) => void

const getRsvpBadgeClassName = (rsvp: string) => {
  if (rsvp === 'Attending') return 'border-success/35 bg-success/12 text-success'
  if (rsvp === 'Declined') return 'border-destructive/30 bg-destructive/10 text-destructive'
  return 'border-foreground/20 bg-accent/12 text-foreground/80'
}

const getDisplayRsvpForGuest = (
  selectedEventId: string,
  invitations: Array<{ eventId: string; rsvp: string | null }>
) => {
  if (selectedEventId !== 'all') {
    return (
      invitations.find((invitation) => invitation.eventId === selectedEventId)?.rsvp ??
      'Not Invited'
    )
  }

  const responses = invitations.map((invitation) => invitation.rsvp ?? 'Not Invited')
  const hasAttending = responses.includes('Attending')
  const hasDeclined = responses.includes('Declined')

  if (hasAttending && hasDeclined) return 'Mixed'
  if (hasAttending) return 'Attending'
  if (hasDeclined) return 'Declined'
  if (responses.includes('Invited')) return 'Invited'
  return 'Not Invited'
}

type GuestDetailPanelContentProps = {
  selectedHousehold: HouseholdWithGuests
  selectedEventId: string
  events: Event[]
  selectedEventResponses?: SelectedEventResponse[]
  communicationLog: CommunicationLogItem[]
  allEventRsvpSummary: Map<string, RsvpSummary>
  editingSections: Set<'contactAddress' | 'notes'>
  toggleEditingSection: (section: 'contactAddress' | 'notes') => void
  drawerDraft: DrawerDraft
  setDrawerDraft: Dispatch<SetStateAction<DrawerDraft>>
  rsvpManageHref: string
  onSaveMembers: (nextMembers: HouseholdMemberDraft[]) => Promise<boolean>
}

export function GuestDetailPanelContent(props: Readonly<GuestDetailPanelContentProps>) {
  const {
    selectedHousehold,
    selectedEventId,
    events,
    selectedEventResponses,
    communicationLog,
    allEventRsvpSummary,
    editingSections,
    toggleEditingSection,
    drawerDraft,
    setDrawerDraft,
    rsvpManageHref,
    onSaveMembers,
  } = props
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false)
  const partyMembers = selectedHousehold.guests.map((guest) => ({
    id: guest.id,
    firstName: guest.firstName,
    lastName: guest.lastName,
    email: guest.email,
    phone: guest.phone,
    ageGroup: guest.ageGroup ?? 'ADULT',
    isPrimaryContact: guest.isPrimaryContact,
  }))

  const primaryContact = useMemo(
    () => selectedHousehold.guests.find((guest) => guest.isPrimaryContact),
    [selectedHousehold]
  )

  const updateDraft = <K extends keyof DrawerDraft>(key: K, value: DrawerDraft[K]) => {
    setDrawerDraft((draft) => ({ ...draft, [key]: value }))
  }

  return (
    <div className='space-y-4'>
      <div className='border-border/70 border-b pb-3'>
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
      </div>

      <GuestDetailSections>
        <ContactAddressSection
          isEditing={editingSections.has('contactAddress')}
          onToggleEdit={() => toggleEditingSection('contactAddress')}
          drawerDraft={drawerDraft}
          updateDraft={updateDraft}
          primaryContactEmail={primaryContact?.email}
          primaryContactPhone={primaryContact?.phone}
          selectedHousehold={selectedHousehold}
        />

        <GuestDetailSection
          title='Party Members'
          contentClassName='space-y-2'
          actionClassName='-mr-1'
          action={
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => setIsMembersModalOpen(true)}
            >
              Manage members
            </Button>
          }
        >
          <ul className='space-y-2'>
            {partyMembers.map((guest, index) => {
              const matchedGuest = selectedHousehold.guests.find((member) => member.id === guest.id)
              const invitations = matchedGuest?.invitations ?? []
              const rsvp = getDisplayRsvpForGuest(selectedEventId, invitations)

              return (
                <li
                  key={guest.id ?? `${guest.firstName}-${guest.lastName}-${index}`}
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
                    <Badge variant='outline' className={getRsvpBadgeClassName(rsvp)}>
                      {rsvp}
                    </Badge>
                  </div>
                </li>
              )
            })}
          </ul>
        </GuestDetailSection>

        {selectedEventId === 'all' ? (
          <GuestDetailSection
            title='Seating & Event'
            contentClassName='space-y-2'
            action={
              <Link
                href={rsvpManageHref}
                className='font-mono text-[0.58rem] text-primary uppercase tracking-wider hover:underline'
              >
                Manage RSVPs in Events
              </Link>
            }
          >
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
          <GuestDetailSection
            title='Seating & Event'
            contentClassName='space-y-2'
            action={
              <Link
                href={rsvpManageHref}
                className='font-mono text-[0.58rem] text-primary uppercase tracking-wider hover:underline'
              >
                Manage RSVPs in Events
              </Link>
            }
          >
            <ul className='space-y-2'>
              {selectedEventResponses?.map((response) => (
                <li
                  key={response.id}
                  className='flex items-center justify-between border-border/50 border-b py-2 last:border-b-0'
                >
                  <span>{response.name}</span>
                  <Badge variant='outline' className={getRsvpBadgeClassName(response.rsvp)}>
                    {response.rsvp}
                  </Badge>
                </li>
              ))}
            </ul>
          </GuestDetailSection>
        )}

        <NotesSection
          isEditing={editingSections.has('notes')}
          onToggleEdit={() => toggleEditingSection('notes')}
          notes={selectedHousehold.notes}
          draftNotes={drawerDraft.notes}
          updateDraft={updateDraft}
        />

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

      <HouseholdMembersModal
        open={isMembersModalOpen}
        onOpenChange={setIsMembersModalOpen}
        members={partyMembers}
        onSave={onSaveMembers}
      />
    </div>
  )
}

type ContactAddressSectionProps = {
  isEditing: boolean
  onToggleEdit: () => void
  drawerDraft: DrawerDraft
  updateDraft: DraftUpdater
  primaryContactEmail: string | null | undefined
  primaryContactPhone: string | null | undefined
  selectedHousehold: HouseholdWithGuests
}

function ContactAddressSection(props: Readonly<ContactAddressSectionProps>) {
  const {
    isEditing,
    onToggleEdit,
    drawerDraft,
    updateDraft,
    primaryContactEmail,
    primaryContactPhone,
    selectedHousehold,
  } = props

  const addressFields = [
    selectedHousehold.address1,
    selectedHousehold.address2,
    selectedHousehold.city,
    selectedHousehold.state,
    selectedHousehold.zipCode,
    selectedHousehold.country,
  ]

  if (isEditing) {
    return (
      <GuestDetailSection
        title='Contact & Address'
        contentClassName='space-y-3'
        action={
          <button
            type='button'
            onClick={onToggleEdit}
            className='font-mono text-[0.58rem] text-primary uppercase tracking-wider hover:underline'
          >
            Done
          </button>
        }
      >
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
      </GuestDetailSection>
    )
  }

  return (
    <GuestDetailSection
      title='Contact & Address'
      contentClassName='space-y-3'
      action={
        <button
          type='button'
          onClick={onToggleEdit}
          className='font-mono text-[0.58rem] text-primary uppercase tracking-wider hover:underline'
          aria-label='Edit Contact & Address'
        >
          Edit
        </button>
      }
    >
      <dl className='grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2'>
        <div>
          <dt className='font-mono text-[0.55rem] text-foreground/55 uppercase tracking-widest'>
            Email
          </dt>
          <dd className='text-foreground/85'>{primaryContactEmail ?? 'Not provided'}</dd>
        </div>
        <div>
          <dt className='font-mono text-[0.55rem] text-foreground/55 uppercase tracking-widest'>
            Phone
          </dt>
          <dd className='text-foreground/85'>{primaryContactPhone ?? 'Not provided'}</dd>
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
    </GuestDetailSection>
  )
}

type NotesSectionProps = {
  isEditing: boolean
  onToggleEdit: () => void
  notes: string | null | undefined
  draftNotes: string
  updateDraft: DraftUpdater
}

function NotesSection(props: Readonly<NotesSectionProps>) {
  const { isEditing, onToggleEdit, notes, draftNotes, updateDraft } = props

  return (
    <GuestDetailSection
      title='Notes'
      action={
        <button
          type='button'
          onClick={onToggleEdit}
          className='font-mono text-[0.58rem] text-primary uppercase tracking-wider hover:underline'
          aria-label='Edit Notes'
        >
          {isEditing ? 'Done' : 'Edit'}
        </button>
      }
    >
      {isEditing ? (
        <textarea
          name='notes'
          value={draftNotes}
          onChange={(event) => updateDraft('notes', event.target.value)}
          placeholder='No notes yet'
          className='min-h-[90px] w-full rounded-md border border-border/70 bg-background p-2.5 text-sm leading-relaxed'
        />
      ) : (
        <p className='text-foreground/85 leading-relaxed'>{notes ?? 'No notes yet'}</p>
      )}
    </GuestDetailSection>
  )
}
