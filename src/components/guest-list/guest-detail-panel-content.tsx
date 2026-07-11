import { Check, Copy } from 'lucide-react'
import Link from 'next/link'
import { type Dispatch, type SetStateAction, useMemo, useState } from 'react'
import { toast } from 'sonner'
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
import { PhoneInput } from '~/components/ui/phone-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Slider } from '~/components/ui/slider'
import { LIKELIHOOD_LABELS } from '~/lib/constants'
import { RSVP_STATUS_VALUES } from '~/lib/constants/rsvp'
import type { HouseholdWithGuests } from '~/server/application/dashboard/dashboard.types'
import type { CommunicationLogEntry } from '~/server/domains/communication-log/communication-log.types'
import { api } from '~/trpc/react'

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
  likelihoodOfAttending: number | null
}

type SelectedEventResponse = {
  id: number
  name: string
  rsvp: string
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

const copyToClipboard = async (value: string) => {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(value)
      return true
    } catch {
      // Fall through to the legacy selection path below.
    }
  }

  const textArea = document.createElement('textarea')
  textArea.value = value
  textArea.setAttribute('readonly', '')
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  document.body.appendChild(textArea)
  textArea.select()
  const copied = document.execCommand('copy')
  document.body.removeChild(textArea)
  return copied
}

type GuestDetailPanelContentProps = {
  selectedHousehold: HouseholdWithGuests
  selectedEventId: string
  events: Event[]
  selectedEventResponses?: SelectedEventResponse[]
  communicationLog: CommunicationLogEntry[]
  editingSections: Set<'contactAddress' | 'notes'>
  toggleEditingSection: (section: 'contactAddress' | 'notes') => void
  drawerDraft: DrawerDraft
  setDrawerDraft: Dispatch<SetStateAction<DrawerDraft>>
  rsvpManageHref: string
  onSaveMembers: (nextMembers: HouseholdMemberDraft[]) => Promise<boolean>
  onAddNote?: (message: string) => void
  onDeleteNote?: (noteId: string) => void
  onRequestDelete?: () => void
}

export function GuestDetailPanelContent(props: Readonly<GuestDetailPanelContentProps>) {
  const {
    selectedHousehold,
    selectedEventId,
    events,
    selectedEventResponses,
    communicationLog,
    editingSections,
    toggleEditingSection,
    drawerDraft,
    setDrawerDraft,
    rsvpManageHref,
    onSaveMembers,
    onAddNote,
    onDeleteNote,
    onRequestDelete,
  } = props
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false)
  const [copiedInviteLink, setCopiedInviteLink] = useState(false)
  const generateHouseholdInviteLink = api.householdInvite.generateLink.useMutation()
  const { data: website } = api.website.getByUserId.useQuery()
  const isWebsiteMissing = website === null
  const partyMembers = selectedHousehold.guests.map((guest) => ({
    id: guest.id,
    firstName: guest.firstName,
    lastName: guest.lastName,
    email: guest.email,
    phone: guest.phone,
    tagIds: guest.guestTags?.map((guestTag) => guestTag.tagId) ?? [],
    ageGroup: guest.ageGroup ?? 'ADULT',
    isPrimaryContact: guest.isPrimaryContact,
    isTagAlong: guest.isTagAlong ?? false,
  }))

  const primaryContact = useMemo(
    () => selectedHousehold.guests.find((guest) => guest.isPrimaryContact),
    [selectedHousehold]
  )

  const updateDraft = <K extends keyof DrawerDraft>(key: K, value: DrawerDraft[K]) => {
    setDrawerDraft((draft) => ({ ...draft, [key]: value }))
  }

  const handleCopyHouseholdInviteLink = async () => {
    if (typeof window === 'undefined') return

    try {
      const result = await generateHouseholdInviteLink.mutateAsync({
        householdId: selectedHousehold.id,
      })
      const copied = await copyToClipboard(result.url)
      setCopiedInviteLink(true)
      setTimeout(() => setCopiedInviteLink(false), 2000)
      toast.success(copied ? 'Save-the-date link copied' : 'Save-the-date link ready to copy', {
        description: copied ? undefined : result.url,
      })
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Failed to copy save-the-date link'
      toast.error(message)
    }
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
            <button
              type='button'
              onClick={() => setIsMembersModalOpen(true)}
              className='rounded-md border border-border/70 px-2 py-1 font-medium text-primary text-xs hover:bg-primary/5'
            >
              Manage members
            </button>
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

        <GuestDetailSection
          title='Save the Date'
          contentClassName='space-y-2'
          action={
            <button
              type='button'
              onClick={handleCopyHouseholdInviteLink}
              disabled={generateHouseholdInviteLink.isPending || isWebsiteMissing}
              className='inline-flex items-center gap-1.5 rounded-md border border-border/70 px-2 py-1 font-medium text-primary text-xs hover:bg-primary/5 disabled:pointer-events-none disabled:opacity-50'
            >
              {copiedInviteLink ? (
                <Check className='h-3.5 w-3.5' aria-hidden='true' />
              ) : (
                <Copy className='h-3.5 w-3.5' aria-hidden='true' />
              )}
              Copy link
            </button>
          }
        >
          {isWebsiteMissing ? (
            <p className='text-foreground/75 text-sm leading-relaxed'>
              Publish your wedding website first to share save-the-date links.{' '}
              <Link href='/website' className='text-primary underline underline-offset-2'>
                Publish your website
              </Link>
              .
            </p>
          ) : (
            <p className='text-foreground/75 text-sm leading-relaxed'>
              Share a household-specific link that opens the save-the-date and lets this party
              update their mailing details.
            </p>
          )}
        </GuestDetailSection>

        <AttendanceLikelihoodSection
          value={drawerDraft.likelihoodOfAttending}
          onChange={(val) => updateDraft('likelihoodOfAttending', val)}
        />

        <EventInvitationsSection
          selectedHousehold={selectedHousehold}
          selectedEventId={selectedEventId}
          events={events}
          rsvpManageHref={rsvpManageHref}
        />

        <NotesSection
          isEditing={editingSections.has('notes')}
          onToggleEdit={() => toggleEditingSection('notes')}
          notes={selectedHousehold.notes}
          draftNotes={drawerDraft.notes}
          updateDraft={updateDraft}
        />

        <CommunicationLogSection
          entries={communicationLog}
          onAddNote={onAddNote}
          onDeleteNote={onDeleteNote}
        />
      </GuestDetailSections>

      <HouseholdMembersModal
        open={isMembersModalOpen}
        onOpenChange={setIsMembersModalOpen}
        members={partyMembers}
        onSave={onSaveMembers}
      />

      {onRequestDelete ? (
        <div className='border-border/70 border-t pt-4'>
          <button
            type='button'
            onClick={onRequestDelete}
            className='rounded-md border border-destructive/30 px-2 py-1 font-medium text-destructive text-xs hover:bg-destructive/10'
          >
            Delete party
          </button>
        </div>
      ) : null}
    </div>
  )
}

type EventInvitationsSectionProps = {
  selectedHousehold: HouseholdWithGuests
  selectedEventId: string
  events: Event[]
  rsvpManageHref: string
}

function EventInvitationsSection(props: Readonly<EventInvitationsSectionProps>) {
  const { selectedHousehold, selectedEventId, events, rsvpManageHref } = props

  const eventsToShow =
    selectedEventId === 'all' ? events : events.filter((event) => event.id === selectedEventId)

  return (
    <GuestDetailSection
      title='Event Invitations & RSVP'
      contentClassName='space-y-2'
      action={
        <Link
          href={rsvpManageHref}
          className='rounded-md border border-border/70 px-2 py-1 font-medium text-primary text-xs hover:bg-primary/5'
        >
          Manage in Events
        </Link>
      }
    >
      {eventsToShow.length === 0 ? (
        <p className='text-foreground/55 text-sm'>No events yet. Create an event to invite guests.</p>
      ) : (
        <ul className='space-y-3'>
          {eventsToShow.map((event) => (
            <li key={event.id} className='border-border/50 border-b pb-3 last:border-b-0'>
              <p className='mb-2 font-medium text-foreground text-sm'>{event.name}</p>
              <ul className='space-y-1.5'>
                {selectedHousehold.guests.map((guest) => {
                  const invitation = guest.invitations.find((inv) => inv.eventId === event.id)

                  return (
                    <li key={guest.id} className='flex items-center justify-between gap-2'>
                      <span className='truncate text-foreground/85 text-sm'>
                        {guest.firstName} {guest.lastName}
                      </span>
                      {invitation ? (
                        <InvitationRsvpSelect
                          guestId={guest.id}
                          eventId={event.id}
                          rsvp={invitation.rsvp ?? 'Not Invited'}
                        />
                      ) : (
                        <Badge variant='outline' className={getRsvpBadgeClassName('Not Invited')}>
                          Not Invited
                        </Badge>
                      )}
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </GuestDetailSection>
  )
}

type InvitationRsvpSelectProps = {
  guestId: number
  eventId: string
  rsvp: string
}

function InvitationRsvpSelect(props: Readonly<InvitationRsvpSelectProps>) {
  const { guestId, eventId, rsvp } = props
  const utils = api.useUtils()

  const updateInvitation = api.invitation.update.useMutation({
    onSuccess: () => {
      void utils.dashboard.getForActiveWorkspace.invalidate()
      void utils.event.getAllByUserIdWithStats.invalidate()
    },
    onError: () => {
      toast.error('Failed to update RSVP. Please try again.')
    },
  })

  return (
    <Select
      value={rsvp}
      disabled={updateInvitation.isPending}
      onValueChange={(value) => {
        if (value === rsvp) return
        updateInvitation.mutate({ guestId, eventId, rsvp: value })
      }}
    >
      <SelectTrigger className='h-7 w-36 shrink-0 text-xs'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {RSVP_STATUS_VALUES.map((status) => (
          <SelectItem key={status} value={status}>
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
            className='rounded-md border border-border/70 px-2 py-1 font-medium text-primary text-xs hover:bg-primary/5'
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
          {/* biome-ignore lint/a11y/noLabelWithoutControl: PhoneInput renders a nested input element */}
          <label className='space-y-1'>
            <span className='font-mono text-[0.55rem] text-foreground/55 uppercase tracking-widest'>
              Phone
            </span>
            <PhoneInput
              name='phone'
              value={drawerDraft.phone || undefined}
              onChange={(nextValue) => updateDraft('phone', nextValue ?? '')}
              className='w-full'
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
          className='rounded-md border border-border/70 px-2 py-1 font-medium text-primary text-xs hover:bg-primary/5'
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

type AttendanceLikelihoodSectionProps = {
  value: number | null
  onChange: (value: number | null) => void
}

function AttendanceLikelihoodSection(props: Readonly<AttendanceLikelihoodSectionProps>) {
  const { value, onChange } = props
  const isUnset = value == null
  const currentValue = value ?? 3

  return (
    <GuestDetailSection title='Attendance Likelihood'>
      <div className='space-y-3'>
        <Slider
          min={1}
          max={5}
          step={1}
          value={[currentValue]}
          onValueChange={([val]) => onChange(val ?? null)}
        />
        <div className='flex justify-between'>
          {LIKELIHOOD_LABELS.map((label, i) => (
            <span
              key={label}
              className={`font-mono text-[0.56rem] uppercase tracking-wider ${
                !isUnset && currentValue === i + 1
                  ? 'font-semibold text-primary'
                  : 'text-foreground/45'
              }`}
            >
              {label}
            </span>
          ))}
        </div>
        {isUnset && (
          <p className='font-mono text-[0.55rem] text-foreground/45 uppercase tracking-wider'>
            Drag slider to set likelihood
          </p>
        )}
      </div>
    </GuestDetailSection>
  )
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
          className='rounded-md border border-border/70 px-2 py-1 font-medium text-primary text-xs hover:bg-primary/5'
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

const LOG_ENTRY_STYLES: Record<CommunicationLogEntry['type'], string> = {
  INVITATION_SENT: 'bg-success',
  RSVP_RECEIVED: 'bg-primary',
  THANK_YOU_SENT: 'bg-amber-500',
  NOTE: 'bg-foreground/40',
}

function getLogEntryKey(entry: CommunicationLogEntry): string {
  if (entry.type === 'NOTE') return entry.id
  return `${entry.type}-${entry.message}-${entry.date.toISOString()}`
}

type CommunicationLogSectionProps = {
  entries: CommunicationLogEntry[]
  onAddNote?: (message: string) => void
  onDeleteNote?: (noteId: string) => void
}

function CommunicationLogSection(props: Readonly<CommunicationLogSectionProps>) {
  const { entries, onAddNote, onDeleteNote } = props
  const [noteText, setNoteText] = useState('')

  const handleSubmitNote = () => {
    const trimmed = noteText.trim()
    if (!trimmed || !onAddNote) return
    onAddNote(trimmed)
    setNoteText('')
  }

  return (
    <GuestDetailSection title='Communication Log' contentClassName='space-y-2'>
      {entries.length === 0 ? (
        <p className='text-foreground/55'>No communication activity yet.</p>
      ) : (
        <ul className='space-y-2'>
          {entries.map((entry) => (
            <li
              key={getLogEntryKey(entry)}
              className='flex gap-2 border-border/50 border-b py-2 last:border-b-0'
            >
              <span
                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${LOG_ENTRY_STYLES[entry.type]}`}
              />
              <div className='min-w-0 flex-1'>
                <p className='text-sm'>{entry.message}</p>
                <div className='flex items-center gap-2'>
                  <p className='font-mono text-[0.55rem] text-foreground/55 uppercase tracking-wider'>
                    {entry.date.toLocaleDateString()}
                  </p>
                  {entry.type === 'NOTE' && (
                    <span className='font-mono text-[0.55rem] text-foreground/40 uppercase tracking-wider'>
                      {entry.actorType === 'etta' ? 'Etta' : 'You'}
                    </span>
                  )}
                  {entry.type === 'NOTE' && onDeleteNote && (
                    <button
                      type='button'
                      onClick={() => onDeleteNote(entry.id)}
                      className='rounded-md px-1.5 py-0.5 font-medium text-destructive/70 text-xs hover:bg-destructive/10 hover:text-destructive'
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {onAddNote && (
        <div className='flex gap-2 pt-1'>
          <input
            type='text'
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmitNote()
            }}
            placeholder='Add a note...'
            className='h-8 min-w-0 flex-1 rounded-md border border-border/70 bg-background px-2.5 text-sm'
          />
          <button
            type='button'
            onClick={handleSubmitNote}
            disabled={!noteText.trim()}
            className='h-8 rounded-md bg-primary/10 px-3 font-medium text-primary text-xs hover:bg-primary/20 disabled:opacity-40 disabled:hover:bg-primary/10'
          >
            Add
          </button>
        </div>
      )}
    </GuestDetailSection>
  )
}
