'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FiPlus, FiTag, FiX } from 'react-icons/fi'
import { toast } from 'sonner'
import { z } from 'zod'

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
import { api } from '~/trpc/react'

type TagsModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedTagIds: string[]
  onTagsChange: (tagIds: string[]) => void
  guestName: string
}

const createTagSchema = z.object({
  name: z.string().trim().min(1, 'Tag name is required').max(20, 'Max 20 characters'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
})

type CreateTagFormData = z.infer<typeof createTagSchema>

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
]

export function TagsModal({
  open,
  onOpenChange,
  selectedTagIds,
  onTagsChange,
  guestName,
}: TagsModalProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedTagIds)

  const { data: tags = [], refetch: refetchTags } = api.guestTag.getAll.useQuery()

  const createTagMutation = api.guestTag.create.useMutation({
    onSuccess: async () => {
      toast.success('Tag created successfully!')
      await refetchTags()
      reset()
      setIsCreating(false)
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to create tag')
    },
  })

  const form = useForm<CreateTagFormData>({
    resolver: zodResolver(createTagSchema),
    defaultValues: {
      name: '',
      color: DEFAULT_COLORS[0],
    },
  })

  const { register, handleSubmit, formState, reset, watch, setValue } = form
  const { errors, isSubmitting } = formState
  const selectedColor = watch('color')

  const handleToggleTag = (tagId: string) => {
    setLocalSelectedIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const handleSave = () => {
    onTagsChange(localSelectedIds)
    onOpenChange(false)
  }

  const handleCreateTag = async (data: CreateTagFormData) => {
    await createTagMutation.mutateAsync(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FiTag className="h-5 w-5" />
            Tags for {guestName}
          </DialogTitle>
          <DialogDescription>
            Select tags for this guest or create new ones. You can select up to 10 tags.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selected Tags Display */}
          {localSelectedIds.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Selected ({localSelectedIds.length}/10)
              </Label>
              <div className="flex flex-wrap gap-2">
                {localSelectedIds.map((tagId) => {
                  const tag = tags.find((t) => t.id === tagId)
                  if (!tag) return null
                  return (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="flex items-center gap-1.5 px-2.5 py-1"
                    >
                      {tag.color && (
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                      )}
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => handleToggleTag(tag.id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <FiX className="h-3 w-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          {/* Available Tags */}
          <div className="space-y-2">
            <Label>Available Tags</Label>
            <div className="max-h-[200px] overflow-y-auto rounded-lg border bg-card p-3">
              {tags.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No tags yet. Create your first tag below!
                </p>
              ) : (
                <div className="space-y-2">
                  {tags.map((tag) => {
                    const isChecked = localSelectedIds.includes(tag.id)
                    const isMaxReached = localSelectedIds.length >= 10 && !isChecked
                    return (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag.id}`}
                          checked={isChecked}
                          disabled={isMaxReached}
                          onCheckedChange={() => handleToggleTag(tag.id)}
                        />
                        <label
                          htmlFor={`tag-${tag.id}`}
                          className="flex cursor-pointer items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {tag.color && (
                            <span
                              className="h-3 w-3 rounded-full"
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
            </div>
          </div>

          {/* Create New Tag */}
          {!isCreating ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreating(true)}
              className="w-full"
            >
              <FiPlus className="mr-2 h-4 w-4" />
              Create New Tag
            </Button>
          ) : (
            <form
              onSubmit={handleSubmit(handleCreateTag)}
              className="bg-muted/50 space-y-3 rounded-lg border p-4"
            >
              <div className="space-y-2">
                <Label htmlFor="tag-name">Tag Name</Label>
                <Input
                  id="tag-name"
                  {...register('name')}
                  placeholder="e.g., VIP, Family, Friends"
                  autoFocus
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setValue('color', color)}
                      className={`h-8 w-8 rounded-full border-2 transition-transform ${
                        selectedColor === color
                          ? 'scale-110 border-primary'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || createTagMutation.isPending}
                  className="flex-1"
                >
                  {isSubmitting || createTagMutation.isPending ? 'Creating...' : 'Create Tag'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreating(false)
                    reset()
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Tags</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
