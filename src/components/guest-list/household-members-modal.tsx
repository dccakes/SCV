'use client'

import { useEffect, useMemo, useState } from 'react'

import { TagsModal } from '~/components/forms/guest/tags-modal'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

export type HouseholdMemberDraft = {
  id?: number
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  tagIds: string[]
  ageGroup: 'ADULT' | 'TEEN' | 'CHILD' | 'INFANT'
  isPrimaryContact: boolean
}

type HouseholdMembersModalProps = {
  open: boolean
  members: HouseholdMemberDraft[]
  onOpenChange: (open: boolean) => void
  onSave: (nextMembers: HouseholdMemberDraft[]) => Promise<boolean>
}

const getMemberName = (member: HouseholdMemberDraft) => {
  const first = member.firstName.trim()
  const last = member.lastName.trim()
  const full = `${first} ${last}`.trim()
  return full.length > 0 ? full : 'Unnamed guest'
}

export function HouseholdMembersModal(props: Readonly<HouseholdMembersModalProps>) {
  const { open, members, onOpenChange, onSave } = props
  const [draftMembers, setDraftMembers] = useState<HouseholdMemberDraft[]>(members)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [tagModalMemberIndex, setTagModalMemberIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    setDraftMembers(members)
    setSaveError(null)
  }, [members, open])

  const primaryCount = useMemo(
    () => draftMembers.filter((member) => member.isPrimaryContact).length,
    [draftMembers]
  )

  const validationMessage = useMemo(() => {
    if (draftMembers.length === 0) {
      return 'A household must include at least one member.'
    }

    if (
      draftMembers.some(
        (member) => member.firstName.trim().length === 0 || member.lastName.trim().length === 0
      )
    ) {
      return 'Each household member must include a first and last name.'
    }

    if (primaryCount !== 1) {
      return 'Choose exactly one primary household member.'
    }

    return null
  }, [draftMembers, primaryCount])

  const setPrimaryMember = (memberIndex: number) => {
    setSaveError(null)
    setDraftMembers((previous) =>
      previous.map((member, index) => ({ ...member, isPrimaryContact: index === memberIndex }))
    )
  }

  const removeMember = (memberIndex: number) => {
    setSaveError(null)
    setDraftMembers((previous) => previous.filter((_, index) => index !== memberIndex))
  }

  const addMember = () => {
    setSaveError(null)
    setDraftMembers((previous) => [
      ...previous,
      {
        firstName: '',
        lastName: '',
        email: null,
        phone: null,
        tagIds: [],
        ageGroup: 'ADULT',
        isPrimaryContact: false,
      },
    ])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Manage Household Members</DialogTitle>
          <DialogDescription>
            Add, update, or remove people in this household before saving.
          </DialogDescription>
        </DialogHeader>

        <div className='max-h-[60vh] space-y-3 overflow-y-auto pr-1'>
          {draftMembers.map((member, index) => {
            const memberName = getMemberName(member)
            const removeDisabled = member.isPrimaryContact && primaryCount < 2

            return (
              <div
                key={member.id ?? `member-${index}`}
                className='rounded-md border border-border/70 p-3'
              >
                <div className='mb-3 flex items-center justify-between gap-2'>
                  <p className='font-medium text-sm'>{memberName}</p>
                  <div className='flex gap-2'>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => setPrimaryMember(index)}
                      disabled={member.isPrimaryContact}
                      aria-label={`Set ${memberName} as primary`}
                    >
                      Set primary
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => setTagModalMemberIndex(index)}
                      aria-label={`Tags for ${memberName}`}
                    >
                      Tags{member.tagIds.length > 0 ? ` (${member.tagIds.length})` : ''}
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => removeMember(index)}
                      disabled={removeDisabled}
                      aria-label={`Remove ${memberName}`}
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                  <label className='space-y-1'>
                    <span className='font-mono text-[0.55rem] text-foreground/55 uppercase tracking-wider'>
                      First name (member {index + 1})
                    </span>
                    <input
                      type='text'
                      aria-label={`First name (member ${index + 1})`}
                      value={member.firstName}
                      onChange={(event) => {
                        const value = event.target.value
                        setSaveError(null)
                        setDraftMembers((previous) =>
                          previous.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, firstName: value } : item
                          )
                        )
                      }}
                      className='h-9 w-full rounded-md border border-border/70 bg-background px-2.5 text-sm'
                    />
                  </label>

                  <label className='space-y-1'>
                    <span className='font-mono text-[0.55rem] text-foreground/55 uppercase tracking-wider'>
                      Last name (member {index + 1})
                    </span>
                    <input
                      type='text'
                      aria-label={`Last name (member ${index + 1})`}
                      value={member.lastName}
                      onChange={(event) => {
                        const value = event.target.value
                        setSaveError(null)
                        setDraftMembers((previous) =>
                          previous.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, lastName: value } : item
                          )
                        )
                      }}
                      className='h-9 w-full rounded-md border border-border/70 bg-background px-2.5 text-sm'
                    />
                  </label>
                </div>
              </div>
            )
          })}
        </div>

        {(validationMessage ?? saveError) && (
          <p className='text-destructive text-sm' role='alert'>
            {validationMessage ?? saveError}
          </p>
        )}

        <DialogFooter className='justify-between sm:justify-between'>
          <Button type='button' variant='outline' onClick={addMember}>
            Add guest
          </Button>
          <div className='flex gap-2'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type='button'
              onClick={async () => {
                if (validationMessage) return

                setSaveError(null)
                setIsSaving(true)
                const didSave = await onSave(draftMembers)
                setIsSaving(false)
                if (didSave) {
                  onOpenChange(false)
                  return
                }

                setSaveError('Unable to save members. Please try again.')
              }}
              disabled={isSaving || validationMessage !== null}
            >
              {isSaving ? 'Saving...' : 'Save members'}
            </Button>
          </div>
        </DialogFooter>
        {tagModalMemberIndex !== null ? (
          <TagsModal
            open
            onOpenChange={(open) => {
              if (!open) setTagModalMemberIndex(null)
            }}
            selectedTagIds={draftMembers[tagModalMemberIndex]?.tagIds ?? []}
            onTagsChange={(tagIds) => {
              setDraftMembers((previous) =>
                previous.map((member, index) =>
                  index === tagModalMemberIndex ? { ...member, tagIds } : member
                )
              )
              setTagModalMemberIndex(null)
            }}
            guestName={getMemberName(
              draftMembers[tagModalMemberIndex] ?? {
                firstName: '',
                lastName: '',
                email: null,
                phone: null,
                tagIds: [],
                ageGroup: 'ADULT',
                isPrimaryContact: false,
              }
            )}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
