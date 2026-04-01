'use client'

import { useCallback, useMemo, useState } from 'react'
import { FiX } from 'react-icons/fi'
import { toast } from 'sonner'

import { useOuterClick } from '~/components/hooks'
import { Badge } from '~/components/ui/badge'
import { MAX_TAGS_PER_GUEST, pickRandomTagColor } from '~/lib/constants'
import { api } from '~/trpc/react'

type Tag = { id: string; name: string; color: string | null }

type TagOption = { type: 'tag'; tag: Tag }
type CreateOption = { type: 'create'; name: string }
type Option = TagOption | CreateOption

type TagInputProps = {
  selectedTagIds: string[]
  tags: Tag[]
  onToggle: (tagId: string) => void
  onTagCreated: (tagId: string) => Promise<void> | void
  ariaLabel?: string
}

export function TagInput({
  selectedTagIds,
  tags,
  onToggle,
  onTagCreated,
  ariaLabel,
}: TagInputProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const containerRef = useOuterClick<HTMLDivElement>(useCallback(() => setIsOpen(false), []))

  const createTagMutation = api.guestTag.create.useMutation({
    onSuccess: async (created) => {
      await onTagCreated(created.id)
      onToggle(created.id)
      setQuery('')
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to create tag')
    },
  })

  const selectedTags = useMemo(
    () => tags.filter((tag) => selectedTagIds.includes(tag.id)),
    [tags, selectedTagIds]
  )

  const trimmedQuery = query.trim().toLowerCase()
  const isMaxReached = selectedTagIds.length >= MAX_TAGS_PER_GUEST

  const options = useMemo(() => {
    const filtered = trimmedQuery
      ? tags.filter((tag) => tag.name.toLowerCase().includes(trimmedQuery))
      : tags

    const exactMatch = tags.some((tag) => tag.name.toLowerCase() === trimmedQuery)
    const canCreate = trimmedQuery.length > 0 && trimmedQuery.length <= 20 && !exactMatch

    const result: Option[] = filtered.map((tag) => ({ type: 'tag' as const, tag }))
    if (canCreate && !isMaxReached) {
      result.push({ type: 'create' as const, name: query.trim() })
    }
    return result
  }, [tags, trimmedQuery, isMaxReached, query])

  const selectOption = (index: number) => {
    const option = options[index]
    if (!option) return

    if (option.type === 'tag') {
      const isSelected = selectedTagIds.includes(option.tag.id)
      if (!isSelected && isMaxReached) return
      onToggle(option.tag.id)
      setQuery('')
    } else {
      createTagMutation.mutate({ name: option.name, color: pickRandomTagColor() })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true)
      e.preventDefault()
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev + 1) % Math.max(options.length, 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev - 1 + options.length) % Math.max(options.length, 1))
        break
      case 'Enter':
        e.preventDefault()
        if (options.length > 0) {
          selectOption(highlightedIndex)
        }
        break
      case 'Backspace': {
        const lastId = selectedTagIds[selectedTagIds.length - 1]
        if (query === '' && lastId) {
          onToggle(lastId)
        }
        break
      }
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  return (
    <div ref={containerRef} className='relative'>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: click-to-focus wrapper for the embedded input */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard events handled by the embedded input */}
      <div
        className='flex min-h-[36px] flex-wrap items-center gap-1 rounded-md border border-border/70 bg-background px-2 py-1 focus-within:ring-1 focus-within:ring-ring'
        onClick={() => containerRef.current?.querySelector('input')?.focus()}
      >
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant='secondary'
            className='flex shrink-0 items-center gap-1 px-1.5 py-0 text-xs'
          >
            {tag.color && (
              <span className='h-2 w-2 rounded-full' style={{ backgroundColor: tag.color }} />
            )}
            {tag.name}
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation()
                onToggle(tag.id)
              }}
              className='ml-0.5 hover:text-destructive'
              aria-label={`Remove ${tag.name}`}
            >
              <FiX className='h-3 w-3' />
            </button>
          </Badge>
        ))}
        <input
          type='text'
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setHighlightedIndex(0)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? 'Type to search or create tags...' : ''}
          disabled={isMaxReached && !query}
          className='min-w-[80px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed'
          aria-label={ariaLabel}
        />
      </div>

      {isOpen && options.length > 0 && (
        <div className='absolute z-50 mt-1 max-h-[180px] w-full overflow-y-auto rounded-md border bg-popover shadow-md'>
          {options.map((option, i) => {
            if (option.type === 'tag') {
              const { tag } = option
              const isSelected = selectedTagIds.includes(tag.id)
              const disabled = !isSelected && isMaxReached

              return (
                <button
                  key={tag.id}
                  type='button'
                  disabled={disabled}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  onClick={() => selectOption(i)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${
                    i === highlightedIndex ? 'bg-accent text-accent-foreground' : ''
                  } ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border text-xs ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border'
                    }`}
                  >
                    {isSelected ? '✓' : ''}
                  </span>
                  {tag.color && (
                    <span
                      className='h-2.5 w-2.5 rounded-full'
                      style={{ backgroundColor: tag.color }}
                    />
                  )}
                  {tag.name}
                </button>
              )
            }

            return (
              <button
                key='__create__'
                type='button'
                onMouseEnter={() => setHighlightedIndex(i)}
                onClick={() => selectOption(i)}
                className={`flex w-full items-center gap-2 border-border/50 border-t px-3 py-1.5 text-left text-sm ${
                  i === highlightedIndex ? 'bg-accent text-accent-foreground' : ''
                } cursor-pointer`}
              >
                <span className='text-muted-foreground'>Create</span>
                <Badge variant='secondary' className='px-1.5 py-0 text-xs'>
                  {option.name}
                </Badge>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
