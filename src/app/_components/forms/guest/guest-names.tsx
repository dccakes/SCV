import { GuestAgeGroup } from '@prisma/client'
import { useState } from 'react'
import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormGetValues,
  type UseFormRegister,
  type UseFormSetValue,
  useWatch,
} from 'react-hook-form'
import { FiMinusCircle, FiTag } from 'react-icons/fi'

import { TagsModal } from '~/app/_components/forms/guest/tags-modal'
import { type HouseholdFormData } from '~/app/_components/forms/guest-form.schema'
import { type Event } from '~/app/utils/shared-types'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Switch } from '~/components/ui/switch'

type Tag = {
  id: string
  name: string
  color: string | null
}

type GuestNameFormProps = {
  events: Event[]
  tags: Tag[]
  guestIndex: number
  control: Control<HouseholdFormData>
  register: UseFormRegister<HouseholdFormData>
  errors: FieldErrors<HouseholdFormData>
  handleRemoveGuest: (index: number) => void
  setValue: UseFormSetValue<HouseholdFormData>
  getValues: UseFormGetValues<HouseholdFormData>
}

export const GuestNameForm = ({
  events,
  tags,
  guestIndex,
  control,
  register,
  errors,
  handleRemoveGuest,
  setValue,
  getValues,
}: GuestNameFormProps) => {
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false)
  const [modalGuestName, setModalGuestName] = useState('')

  // Get field-level errors for this guest
  const guestErrors = errors.guestParty?.[guestIndex]

  // Watch only the current guest's tagIds (needed for rendering)
  const selectedTagIds =
    useWatch({
      control,
      name: `guestParty.${guestIndex}.tagIds`,
    }) ?? []

  const handlePrimaryContactChange = (checked: boolean) => {
    if (checked) {
      // Read guest party synchronously without subscription
      const guestParty = getValues('guestParty')
      // Uncheck all other guests
      guestParty?.forEach((_, index) => {
        if (index !== guestIndex) {
          setValue(`guestParty.${index}.isPrimaryContact`, false)
        }
      })
    }
  }

  const handleOpenTagsModal = () => {
    // Compute guest name only when modal opens (no subscription needed)
    const firstName = getValues(`guestParty.${guestIndex}.firstName`) ?? ''
    const lastName = getValues(`guestParty.${guestIndex}.lastName`) ?? ''
    setModalGuestName(
      firstName || lastName ? `${firstName} ${lastName}`.trim() : `Guest ${guestIndex + 1}`
    )
    setIsTagsModalOpen(true)
  }

  const handleTagsChange = (tagIds: string[]) => {
    setValue(`guestParty.${guestIndex}.tagIds`, tagIds, {
      shouldDirty: true,
    })
  }

  return (
    <div className="border-b last:border-b-0">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Guest {guestIndex + 1}</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenTagsModal}
              className="h-7 gap-1.5 px-2 text-xs"
            >
              <FiTag className="h-3 w-3" />
              Tags
              {selectedTagIds.length > 0 && (
                <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[10px]">
                  {selectedTagIds.length}
                </Badge>
              )}
            </Button>
          </div>
          {guestIndex > 0 && (
            <button
              type="button"
              onClick={() => handleRemoveGuest(guestIndex)}
              aria-label={`Remove Guest ${guestIndex + 1}`}
              className="text-muted-foreground transition-colors hover:text-destructive"
            >
              <FiMinusCircle size={24} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Tags Modal */}
        <TagsModal
          open={isTagsModalOpen}
          onOpenChange={setIsTagsModalOpen}
          selectedTagIds={selectedTagIds}
          onTagsChange={handleTagsChange}
          guestName={modalGuestName}
        />

        {/* Display selected tags */}
        {selectedTagIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTagIds.map((tagId) => {
              const tag = tags.find((t) => t.id === tagId)
              if (!tag) return null
              return (
                <Badge key={tag.id} variant="secondary" className="flex items-center gap-1.5">
                  {tag.color && (
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                  )}
                  {tag.name}
                </Badge>
              )
            })}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`guest${guestIndex}-firstName`}>
              First Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`guest${guestIndex}-firstName`}
              {...register(`guestParty.${guestIndex}.firstName`)}
              className={guestErrors?.firstName ? 'border-destructive' : ''}
            />
            {guestErrors?.firstName && (
              <p className="text-sm text-destructive">{guestErrors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`guest${guestIndex}-lastName`}>
              Last Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`guest${guestIndex}-lastName`}
              {...register(`guestParty.${guestIndex}.lastName`)}
              className={guestErrors?.lastName ? 'border-destructive' : ''}
            />
            {guestErrors?.lastName && (
              <p className="text-sm text-destructive">{guestErrors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`guest${guestIndex}-email`}>Email</Label>
            <Input
              id={`guest${guestIndex}-email`}
              {...register(`guestParty.${guestIndex}.email`)}
              type="email"
              className={guestErrors?.email ? 'border-destructive' : ''}
            />
            {guestErrors?.email && (
              <p className="text-sm text-destructive">{guestErrors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`guest${guestIndex}-phone`}>Phone</Label>
            <Input
              id={`guest${guestIndex}-phone`}
              {...register(`guestParty.${guestIndex}.phone`)}
              className={guestErrors?.phone ? 'border-destructive' : ''}
            />
            {guestErrors?.phone && (
              <p className="text-sm text-destructive">{guestErrors.phone.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`guest${guestIndex}-ageGroup`}>
            Age Group <span className="text-destructive">*</span>
          </Label>
          <Controller
            name={`guestParty.${guestIndex}.ageGroup`}
            control={control}
            render={({ field }) => (
              <Select value={field.value ?? 'ADULT'} onValueChange={field.onChange}>
                <SelectTrigger id={`guest${guestIndex}-ageGroup`}>
                  <SelectValue placeholder="Select age group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GuestAgeGroup.INFANT}>Infant (0-2 years)</SelectItem>
                  <SelectItem value={GuestAgeGroup.CHILD}>Child (3-12 years)</SelectItem>
                  <SelectItem value={GuestAgeGroup.TEEN}>Teen (13-17 years)</SelectItem>
                  <SelectItem value={GuestAgeGroup.ADULT}>Adult (18+ years)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {guestErrors?.ageGroup && (
            <p className="text-sm text-destructive">{guestErrors.ageGroup.message}</p>
          )}
        </div>

        <div className="bg-muted/50 flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor={`guest${guestIndex}-isPrimaryContact`} className="text-base">
              Primary Contact
            </Label>
            <p className="text-sm text-muted-foreground">This guest will receive correspondence</p>
          </div>
          <Controller
            name={`guestParty.${guestIndex}.isPrimaryContact`}
            control={control}
            render={({ field }) => (
              <Switch
                id={`guest${guestIndex}-isPrimaryContact`}
                checked={field.value ?? false}
                onCheckedChange={(checked) => {
                  field.onChange(checked)
                  handlePrimaryContactChange(checked)
                }}
              />
            )}
          />
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Event Invitations</h4>
          <div className="space-y-2">
            {events?.map((event: Event) => (
              <Controller
                key={event.id}
                name={`guestParty.${guestIndex}.invites.${event.id}`}
                control={control}
                render={({ field }) => (
                  <div className="hover:bg-muted/50 flex items-center justify-between rounded-lg border bg-card p-3 transition-colors">
                    <div className="mr-3 min-w-0 flex-1">
                      <Label
                        htmlFor={`guest${guestIndex}-event-${event.id}`}
                        className="cursor-pointer font-medium"
                      >
                        {event.name}
                      </Label>
                      {event.date && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(event.date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Switch
                      id={`guest${guestIndex}-event-${event.id}`}
                      checked={['Invited', 'Attending', 'Declined'].includes(field.value ?? '')}
                      onCheckedChange={(checked) => {
                        field.onChange(checked ? 'Invited' : 'Not Invited')
                      }}
                    />
                  </div>
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
