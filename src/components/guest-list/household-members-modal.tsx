'use client'

import { memo, useEffect, useMemo, useState } from 'react'

import { TagInput } from '~/components/guest-list/tag-input'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { AGE_GROUP_OPTIONS, MAX_TAGS_PER_GUEST } from '~/lib/constants'
import { api } from '~/trpc/react'

export type HouseholdMemberDraft = {
  id?: number
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  tagIds: string[]
  ageGroup: 'ADULT' | 'TEEN' | 'CHILD' | 'INFANT'
  isPrimaryContact: boolean
  isTagAlong: boolean
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

  const { data: tags = [], refetch: refetchTags } = api.guestTag.getAll.useQuery()

  useEffect(() => {
    if (!open) return
    setDraftMembers(members)
    setSaveError(null)
  }, [members, open])

  const primaryCount = useMemo(
    () => draftMembers.filter((member) => member.isPrimaryContact && !member.isTagAlong).length,
    [draftMembers]
  )

  const validationMessage = useMemo(() => {
    if (draftMembers.length === 0) {
      return 'A household must include at least one member.'
    }

    if (draftMembers.every((member) => member.isTagAlong)) {
      return 'A household must include at least one non-tag-along member.'
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

  const updateMember = (memberIndex: number, patch: Partial<HouseholdMemberDraft>) => {
    setSaveError(null)
    setDraftMembers((previous) =>
      previous.map((member, index) => (index === memberIndex ? { ...member, ...patch } : member))
    )
  }

  const setPrimaryMember = (memberIndex: number) => {
    setSaveError(null)
    setDraftMembers((previous) =>
      previous.map((member, index) => ({ ...member, isPrimaryContact: index === memberIndex }))
    )
  }

  const toggleTagAlong = (memberIndex: number) => {
    setSaveError(null)
    setDraftMembers((previous) =>
      previous.map((member, index) => {
        if (index !== memberIndex) return member
        const nextIsTagAlong = !member.isTagAlong
        return {
          ...member,
          isTagAlong: nextIsTagAlong,
          isPrimaryContact: nextIsTagAlong ? false : member.isPrimaryContact,
        }
      })
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
        isTagAlong: false,
      },
    ])
  }

  const toggleTag = (memberIndex: number, tagId: string) => {
    setSaveError(null)
    setDraftMembers((previous) =>
      previous.map((member, index) => {
        if (index !== memberIndex) return member
        const has = member.tagIds.includes(tagId)
        if (!has && member.tagIds.length >= MAX_TAGS_PER_GUEST) return member
        return {
          ...member,
          tagIds: has ? member.tagIds.filter((id) => id !== tagId) : [...member.tagIds, tagId],
        }
      })
    )
  }

  const handleTagCreated = async (_tagId: string) => {
    await refetchTags()
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
          {draftMembers.map((member, index) => (
            <MemberRow
              key={member.id ?? `member-${index}`}
              member={member}
              index={index}
              tags={tags}
              primaryCount={primaryCount}
              onUpdate={updateMember}
              onSetPrimary={setPrimaryMember}
              onToggleTagAlong={toggleTagAlong}
              onRemove={removeMember}
              onToggleTag={toggleTag}
              onTagCreated={handleTagCreated}
            />
          ))}
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
      </DialogContent>
    </Dialog>
  )
}

type MemberRowProps = {
  member: HouseholdMemberDraft
  index: number
  tags: Array<{ id: string; name: string; color: string | null }>
  primaryCount: number
  onUpdate: (index: number, patch: Partial<HouseholdMemberDraft>) => void
  onSetPrimary: (index: number) => void
  onToggleTagAlong: (index: number) => void
  onRemove: (index: number) => void
  onToggleTag: (memberIndex: number, tagId: string) => void
  onTagCreated: (tagId: string) => Promise<void> | void
}

const MemberRow = memo(function MemberRow(props: Readonly<MemberRowProps>) {
  const {
    member,
    index,
    tags,
    primaryCount,
    onUpdate,
    onSetPrimary,
    onToggleTagAlong,
    onRemove,
    onToggleTag,
    onTagCreated,
  } = props

  const memberName = getMemberName(member)
  const removeDisabled = member.isPrimaryContact && primaryCount < 2

  return (
    <div className='rounded-md border border-border/70 p-3'>
      <div className='mb-3 flex items-center justify-between gap-2'>
        <p className='font-medium text-sm'>{memberName}</p>
        <div className='flex gap-2'>
          <Button
            type='button'
            variant={member.isTagAlong ? 'default' : 'outline'}
            size='sm'
            onClick={() => onToggleTagAlong(index)}
            aria-label={`Toggle tag-along for ${memberName}`}
          >
            Tag-along
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => onSetPrimary(index)}
            disabled={member.isPrimaryContact || member.isTagAlong}
            aria-label={`Set ${memberName} as primary`}
          >
            Set primary
          </Button>
          <Button
            type='button'
            variant='destructive'
            size='sm'
            onClick={() => onRemove(index)}
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
            onChange={(e) => onUpdate(index, { firstName: e.target.value })}
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
            onChange={(e) => onUpdate(index, { lastName: e.target.value })}
            className='h-9 w-full rounded-md border border-border/70 bg-background px-2.5 text-sm'
          />
        </label>

        <div className='space-y-1'>
          <span className='font-mono text-[0.55rem] text-foreground/55 uppercase tracking-wider'>
            Age group
          </span>
          <Select
            value={member.ageGroup}
            onValueChange={(value) =>
              onUpdate(index, { ageGroup: value as HouseholdMemberDraft['ageGroup'] })
            }
          >
            <SelectTrigger className='h-9' aria-label={`Age group for ${memberName}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AGE_GROUP_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-1 sm:col-span-2'>
          <span className='font-mono text-[0.55rem] text-foreground/55 uppercase tracking-wider'>
            Tags
          </span>
          <TagInput
            selectedTagIds={member.tagIds}
            tags={tags}
            onToggle={(tagId) => onToggleTag(index, tagId)}
            onTagCreated={(tagId) => onTagCreated(tagId)}
            ariaLabel={`Tags for ${memberName}`}
          />
        </div>
      </div>
    </div>
  )
})
