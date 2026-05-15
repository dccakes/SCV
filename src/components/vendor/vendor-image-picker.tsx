'use client'

import { Check } from 'lucide-react'
import { useState } from 'react'

import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { cn } from '~/lib/utils'

type VendorImagePickerProps = Readonly<{
  candidates: string[]
  maxSelect: number
  onConfirm: (selectedUrls: string[]) => void
  onClose: () => void
}>

export function VendorImagePicker({
  candidates,
  maxSelect,
  onConfirm,
  onClose,
}: VendorImagePickerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (url: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(url)) {
        next.delete(url)
      } else if (next.size < maxSelect) {
        next.add(url)
      }
      return next
    })
  }

  const handleConfirm = () => {
    onConfirm([...selected])
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-h-[80vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Select images from website</DialogTitle>
          <DialogDescription>
            Choose up to {maxSelect} image{maxSelect !== 1 ? 's' : ''} to add.
            {selected.size > 0 && ` ${selected.size} selected.`}
          </DialogDescription>
        </DialogHeader>

        {candidates.length === 0 ? (
          <p className='py-8 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
            No images found
          </p>
        ) : (
          <div className='grid grid-cols-3 gap-2 py-2'>
            {candidates.map((url) => {
              const isSelected = selected.has(url)
              const isDisabled = !isSelected && selected.size >= maxSelect
              return (
                <button
                  key={url}
                  type='button'
                  onClick={() => toggle(url)}
                  disabled={isDisabled}
                  aria-pressed={isSelected}
                  className={cn(
                    'relative aspect-square overflow-hidden rounded-md bg-muted transition-opacity',
                    isDisabled ? 'opacity-40' : 'cursor-pointer hover:opacity-90',
                    isSelected && 'ring-2 ring-primary ring-offset-1'
                  )}
                >
                  {/* biome-ignore lint/performance/noImgElement: external URLs from vendor websites have unknown domains, so next/image cannot be used */}
                  <img
                    src={url}
                    alt=''
                    className='h-full w-full object-cover'
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  {isSelected && (
                    <div className='absolute inset-0 flex items-center justify-center bg-primary/20'>
                      <div className='rounded-full bg-primary p-1'>
                        <Check className='h-3 w-3 text-primary-foreground' />
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selected.size === 0}>
            Add selected ({selected.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
