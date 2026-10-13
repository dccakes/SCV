'use client'

import Link from 'next/link'

import { GuestDetailDrawer } from '~/components/guest-list/v2/drawer/guest-detail-drawer'
import {
  GuestDetailSection,
  GuestDetailSections,
} from '~/components/guest-list/v2/drawer/guest-detail-sections'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import type {
  SeatingGuest,
  SeatingHousehold,
  SeatingTableView,
} from '~/server/domains/seating/seating.types'

type SeatingGuestDrawerProps = {
  guest: SeatingGuest | null
  household: SeatingHousehold | null
  tables: SeatingTableView[]
  onClose: () => void
  onSelectGuest: (guestId: number) => void
  onUnseat: (guestId: number) => void
}

const AGE_GROUP_LABELS: Record<string, string> = {
  INFANT: 'Infant',
  CHILD: 'Child',
  TEEN: 'Teen',
  ADULT: 'Adult',
}

const fullName = (guest: Pick<SeatingGuest, 'firstName' | 'lastName'>) =>
  `${guest.firstName} ${guest.lastName}`.trim()

function DetailRow(props: Readonly<{ label: string; value: string | null }>) {
  return (
    <div className='flex justify-between gap-4'>
      <span>{props.label}</span>
      <span className='text-right text-foreground'>{props.value || '—'}</span>
    </div>
  )
}

export function SeatingGuestDrawer(props: Readonly<SeatingGuestDrawerProps>) {
  const { guest, household, tables, onClose, onSelectGuest, onUnseat } = props
  const tableName = (tableId: string | null) =>
    tables.find((table) => table.id === tableId)?.name ?? null
  const seatedAt = guest ? tableName(guest.tableId) : null

  return (
    <GuestDetailDrawer
      open={guest !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={guest ? fullName(guest) : 'Guest details'}
      subtitle={seatedAt ? `Seated at ${seatedAt}` : 'Not seated yet'}
      headerMeta={
        guest ? (
          <div className='flex flex-wrap gap-1.5'>
            <Badge variant='outline' className='text-[0.58rem] uppercase tracking-wider'>
              {guest.rsvp}
            </Badge>
            {guest.tags.map((tag) => (
              <Badge
                key={tag}
                variant='outline'
                className='border-foreground/15 bg-foreground/[0.04] text-[0.58rem] text-foreground/70 uppercase tracking-wider'
              >
                {tag}
              </Badge>
            ))}
          </div>
        ) : null
      }
      footer={
        <Button asChild variant='outline' className='w-full'>
          <Link href='/guest-list'>Edit in Guest List</Link>
        </Button>
      }
    >
      {guest ? (
        <GuestDetailSections>
          <GuestDetailSection
            title='Seating'
            action={
              guest.tableId ? (
                <Button size='sm' variant='ghost' onClick={() => onUnseat(guest.id)}>
                  Remove from table
                </Button>
              ) : null
            }
          >
            <DetailRow label='Table' value={seatedAt ?? 'Unassigned'} />
          </GuestDetailSection>

          <GuestDetailSection title='Guest' contentClassName='space-y-1.5'>
            <DetailRow label='Email' value={guest.email} />
            <DetailRow label='Phone' value={guest.phone} />
            <DetailRow
              label='Age group'
              value={AGE_GROUP_LABELS[guest.ageGroup ?? 'ADULT'] ?? null}
            />
            <DetailRow label='Dietary needs' value={guest.dietaryRestrictions} />
            {guest.isTagAlong ? <DetailRow label='Tag-along' value='Yes' /> : null}
          </GuestDetailSection>

          {household ? (
            <GuestDetailSection title='Household' contentClassName='space-y-3'>
              <ul className='space-y-1'>
                {household.guests.map((member) => (
                  <li key={member.id} className='flex items-center justify-between gap-3'>
                    <button
                      type='button'
                      onClick={() => onSelectGuest(member.id)}
                      className={
                        member.id === guest.id
                          ? 'font-medium text-foreground'
                          : 'text-foreground/80 underline-offset-2 hover:underline'
                      }
                    >
                      {fullName(member)}
                      {member.isPrimaryContact ? ' (primary)' : ''}
                    </button>
                    <span className='text-xs'>{tableName(member.tableId) ?? 'Unassigned'}</span>
                  </li>
                ))}
              </ul>
              {household.address ? <p>{household.address}</p> : null}
              {household.notes ? <p className='whitespace-pre-wrap'>{household.notes}</p> : null}
            </GuestDetailSection>
          ) : null}
        </GuestDetailSections>
      ) : null}
    </GuestDetailDrawer>
  )
}
