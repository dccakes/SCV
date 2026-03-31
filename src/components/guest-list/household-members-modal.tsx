'use client'

import { useEffect, useMemo, useState } from 'react'
import { FiPlus, FiTag, FiX } from 'react-icons/fi'
import { toast } from 'sonner'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
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

const AGE_GROUP_LABELS: Record<HouseholdMemberDraft['ageGroup'], string> = {
  INFANT: 'Infant (0-2)',
  CHILD: 'Child (3-12)',
  TEEN: 'Teen (13-17)',
  ADULT: 'Adult (18+)',
}

const DEFAULT_COLORS = [
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
]

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

  const [isCreatingTag, setIsCreatingTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(DEFAULT_COLORS[0]!)

  const createTagMutation = api.guestTag.create.useMutation({
    onSuccess: async () => {
      toast.success('Tag created!')
      await refetchTags()
      setNewTagName('')
      setIsCreatingTag(false)
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to create tag')
    },
  })

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
        if (!has && member.tagIds.length >= 10) return member
        return {
          ...member,
          tagIds: has ? member.tagIds.filter((id) => id !== tagId) : [...member.tagIds, tagId],
        }
      })
    )
  }

  const updateAgeGroup = (memberIndex: number, ageGroup: HouseholdMemberDraft['ageGroup']) => {
    setSaveError(null)
    setDraftMembers((previous) =>
      previous.map((member, index) =>
        index === memberIndex ? { ...member, ageGroup } : member
      )
    )
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
            const memberTags = tags.filter((tag) => member.tagIds.includes(tag.id))

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
                      variant={member.isTagAlong ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => toggleTagAlong(index)}
                      aria-label={`Toggle tag-along for ${memberName}`}
                    >
                      Tag-along
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => setPrimaryMember(index)}
                      disabled={member.isPrimaryContact || member.isTagAlong}
                      aria-label={`Set ${memberName} as primary`}
                    >
                      Set primary
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

                  <div className='space-y-1'>
                    <span className='font-mono text-[0.55rem] text-foreground/55 uppercase tracking-wider'>
                      Age group
                    </span>
                    <Select
                      value={member.ageGroup}
                      onValueChange={(value) =>
                        updateAgeGroup(index, value as HouseholdMemberDraft['ageGroup'])
                      }
                    >
                      <SelectTrigger
                        className='h-9'
                        aria-label={`Age group for ${memberName}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='INFANT'>Infant (0-2)</SelectItem>
                        <SelectItem value='CHILD'>Child (3-12)</SelectItem>
                        <SelectItem value='TEEN'>Teen (13-17)</SelectItem>
                        <SelectItem value='ADULT'>Adult (18+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-1'>
                    <span className='font-mono text-[0.55rem] text-foreground/55 uppercase tracking-wider'>
                      Tags ({member.tagIds.length}/10)
                    </span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type='button'
                          variant='outline'
                          className='h-9 w-full justify-start gap-2 text-sm'
                          aria-label={`Edit tags for ${memberName}`}
                        >
                          <FiTag className='h-3.5 w-3.5 shrink-0' />
                          {memberTags.length > 0 ? (
                            <span className='truncate'>
                              {memberTags.map((t) => t.name).join(', ')}
                            </span>
                          ) : (
                            <span className='text-muted-foreground'>Select tags</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='w-64 p-3' align='start'>
                        <div className='space-y-3'>
                          {tags.length === 0 && !isCreatingTag && (
                            <p className='py-2 text-center text-muted-foreground text-sm'>
                              No tags yet.
                            </p>
                          )}
                          {tags.length > 0 && (
                            <div className='max-h-[180px] space-y-1.5 overflow-y-auto'>
                              {tags.map((tag) => {
                                const isChecked = member.tagIds.includes(tag.id)
                                const isMaxReached = member.tagIds.length >= 10 && !isChecked
                                return (
                                  <div key={tag.id} className='flex items-center space-x-2'>
                                    <Checkbox
                                      id={`tag-${member.id ?? index}-${tag.id}`}
                                      checked={isChecked}
                                      disabled={isMaxReached}
                                      onCheckedChange={() => toggleTag(index, tag.id)}
                                    />
                                    <label
                                      htmlFor={`tag-${member.id ?? index}-${tag.id}`}
                                      className='flex cursor-pointer items-center gap-1.5 text-sm leading-none'
                                    >
                                      {tag.color && (
                                        <span
                                          className='h-2.5 w-2.5 rounded-full'
                                          style={{ backgroundColor: tag.color }}
                                        />
                                      )}
                                      {tag.name}
                                    </label>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                          {!isCreatingTag ? (
                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              onClick={() => setIsCreatingTag(true)}
                              className='w-full'
                            >
                              <FiPlus className='mr-1.5 h-3.5 w-3.5' />
                              New tag
                            </Button>
                          ) : (
                            <div className='space-y-2 border-t pt-2'>
                              <Input
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder='Tag name'
                                maxLength={20}
                                autoFocus
                              />
                              <div className='flex gap-1.5'>
                                {DEFAULT_COLORS.map((color) => (
                                  <button
                                    key={color}
                                    type='button'
                                    onClick={() => setNewTagColor(color)}
                                    className={`h-6 w-6 rounded-full border-2 ${
                                      newTagColor === color
                                        ? 'scale-110 border-primary'
                                        : 'border-transparent'
                                    }`}
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                              <div className='flex gap-2'>
                                <Button
                                  type='button'
                                  size='sm'
                                  className='flex-1'
                                  disabled={
                                    newTagName.trim().length === 0 || createTagMutation.isPending
                                  }
                                  onClick={() =>
                                    createTagMutation.mutate({
                                      name: newTagName.trim(),
                                      color: newTagColor,
                                    })
                                  }
                                >
                                  {createTagMutation.isPending ? 'Creating...' : 'Create'}
                                </Button>
                                <Button
                                  type='button'
                                  variant='outline'
                                  size='sm'
                                  onClick={() => {
                                    setIsCreatingTag(false)
                                    setNewTagName('')
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {memberTags.length > 0 && (
                  <div className='mt-2 flex flex-wrap gap-1.5'>
                    {memberTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant='secondary'
                        className='flex items-center gap-1 px-2 py-0.5 text-xs'
                      >
                        {tag.color && (
                          <span
                            className='h-2 w-2 rounded-full'
                            style={{ backgroundColor: tag.color }}
                          />
                        )}
                        {tag.name}
                        <button
                          type='button'
                          onClick={() => toggleTag(index, tag.id)}
                          className='ml-0.5 hover:text-destructive'
                          aria-label={`Remove tag ${tag.name} from ${memberName}`}
                        >
                          <FiX className='h-3 w-3' />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
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
      </DialogContent>
    </Dialog>
  )
}
