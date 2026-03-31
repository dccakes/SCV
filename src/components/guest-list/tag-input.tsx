'use client'

import { useEffect, useRef, useState } from 'react'
import { FiX } from 'react-icons/fi'
import { toast } from 'sonner'

import { Badge } from '~/components/ui/badge'
import { api } from '~/trpc/react'

const RANDOM_COLORS = [
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
]

const pickRandomColor = () =>
  RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)] ?? RANDOM_COLORS[0]

type TagInputProps = {
  selectedTagIds: string[]
  onToggle: (tagId: string) => void
  maxTags?: number
  ariaLabel?: string
}

export function TagInput({ selectedTagIds, onToggle, maxTags = 10, ariaLabel }: TagInputProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: tags = [], refetch: refetchTags } = api.guestTag.getAll.useQuery()

  const createTagMutation = api.guestTag.create.useMutation({
    onSuccess: async (created) => {
      await refetchTags()
      onToggle(created.id)
      setQuery('')
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to create tag')
    },
  })

  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id))

  const trimmedQuery = query.trim().toLowerCase()
  const filtered = trimmedQuery
    ? tags.filter((tag) => tag.name.toLowerCase().includes(trimmedQuery))
    : tags

  const exactMatch = tags.some((tag) => tag.name.toLowerCase() === trimmedQuery)
  const canCreate = trimmedQuery.length > 0 && trimmedQuery.length <= 20 && !exactMatch
  const isMaxReached = selectedTagIds.length >= maxTags

  // Build the list of options: filtered tags + optional "create" row
  const options: Array<{ type: 'tag'; id: string } | { type: 'create'; name: string }> = [
    ...filtered.map((tag) => ({ type: 'tag' as const, id: tag.id })),
    ...(canCreate && !isMaxReached ? [{ type: 'create' as const, name: query.trim() }] : []),
  ]

  // Reset highlight when query changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally reacts to trimmedQuery changes
  useEffect(() => {
    setHighlightedIndex(0)
  }, [trimmedQuery])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectOption = (index: number) => {
    const option = options[index]
    if (!option) return

    if (option.type === 'tag') {
      const isSelected = selectedTagIds.includes(option.id)
      if (!isSelected && isMaxReached) return
      onToggle(option.id)
      setQuery('')
    } else {
      createTagMutation.mutate({ name: option.name, color: pickRandomColor() })
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
        inputRef.current?.blur()
        break
    }
  }

  return (
    <div ref={containerRef} className='relative'>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: click-to-focus wrapper for the embedded input */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard events handled by the embedded input */}
      <div
        className='flex min-h-[36px] flex-wrap items-center gap-1 rounded-md border border-border/70 bg-background px-2 py-1 focus-within:ring-1 focus-within:ring-ring'
        onClick={() => inputRef.current?.focus()}
      >
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant='secondary'
            className='flex shrink-0 items-center gap-1 px-1.5 py-0 text-xs'
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
          ref={inputRef}
          type='text'
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
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
              const tag = tags.find((t) => t.id === option.id)
              if (!tag) return null
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
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${
                  i === highlightedIndex ? 'bg-accent text-accent-foreground' : ''
                } cursor-pointer border-border/50 border-t`}
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
