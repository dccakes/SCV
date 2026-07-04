'use client'

/**
 * Image upload primitives for the wedding website editor.
 *
 * Uploads go straight to Vercel Blob from the browser via the
 * `/api/blob/upload` client-upload route (the same route used elsewhere in the
 * app), so large files never pass through the Next.js server. Each primitive is
 * "controlled": it reports the resulting public URL(s) back through `onChange`
 * and leaves persistence to the caller.
 */

import { upload } from '@vercel/blob/client'
import { ImagePlus, Loader2, X } from 'lucide-react'
import Image from 'next/image'
import { useId, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { isDuplicateBlobError } from '~/lib/blob'
import { MAX_FILE_SIZE } from '~/lib/upload-config'

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ACCEPT_ATTR = ACCEPTED_IMAGE_TYPES.join(',')

function isAcceptableImage(file: File): boolean {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    toast.error('Please choose a JPG, PNG, WebP, or GIF image.')
    return false
  }
  if (file.size > MAX_FILE_SIZE) {
    toast.error('Images must be 8 MB or smaller.')
    return false
  }
  return true
}

async function uploadImage(file: File): Promise<string> {
  const result = await upload(file.name, file, {
    access: 'public',
    handleUploadUrl: '/api/blob/upload',
  })
  return result.url
}

type SingleImageUploadProps = Readonly<{
  value: string | null
  onChange: (url: string | null) => void
  /** Tailwind aspect ratio utility for the preview frame. */
  aspectClassName?: string
  label?: string
  disabled?: boolean
}>

/** Upload (or replace) a single image, with an inline preview and remove. */
export function SingleImageUpload({
  value,
  onChange,
  aspectClassName = 'aspect-[16/9]',
  label = 'Upload image',
  disabled = false,
}: SingleImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFile = async (file: File | undefined) => {
    if (!file || !isAcceptableImage(file)) {
      return
    }
    setIsUploading(true)
    try {
      const url = await uploadImage(file)
      onChange(url)
    } catch (error) {
      toast.error(
        isDuplicateBlobError(error)
          ? `A file named "${file.name}" already exists. Please rename it and try again.`
          : 'Upload failed. Please try again.'
      )
    } finally {
      setIsUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div className='space-y-2'>
      <input
        ref={inputRef}
        type='file'
        accept={ACCEPT_ATTR}
        className='hidden'
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      {value ? (
        <div
          className={`relative w-full overflow-hidden rounded-[10px] border border-border ${aspectClassName}`}
        >
          <Image
            src={value}
            alt=''
            fill
            className='object-cover'
            sizes='(max-width: 768px) 100vw, 600px'
          />
          <button
            type='button'
            aria-label='Remove image'
            disabled={disabled || isUploading}
            onClick={() => onChange(null)}
            className='absolute top-2 right-2 rounded-full bg-background/85 p-1.5 text-foreground shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground'
          >
            <X aria-hidden='true' className='h-4 w-4' />
          </button>
        </div>
      ) : (
        <button
          type='button'
          disabled={disabled || isUploading}
          onClick={() => inputRef.current?.click()}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-[10px] border border-border border-dashed bg-muted/20 text-muted-foreground transition-colors hover:bg-muted/40 ${aspectClassName}`}
        >
          {isUploading ? (
            <Loader2 aria-hidden='true' className='h-6 w-6 animate-spin' />
          ) : (
            <ImagePlus aria-hidden='true' className='h-6 w-6' />
          )}
          <span className='font-sans text-sm'>{isUploading ? 'Uploading…' : label}</span>
        </button>
      )}
      {value ? (
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={disabled || isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? 'Uploading…' : 'Replace image'}
        </Button>
      ) : null}
    </div>
  )
}

type ImageGalleryUploadProps = Readonly<{
  values: string[]
  onChange: (urls: string[]) => void
  maxImages: number
  disabled?: boolean
}>

/** Upload several images into an ordered gallery, each removable. */
export function ImageGalleryUpload({
  values,
  onChange,
  maxImages,
  disabled = false,
}: ImageGalleryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const [isUploading, setIsUploading] = useState(false)
  const remaining = maxImages - values.length
  const atCapacity = remaining <= 0

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      return
    }
    const files = Array.from(fileList).filter(isAcceptableImage).slice(0, Math.max(0, remaining))
    if (files.length === 0) {
      return
    }
    setIsUploading(true)
    try {
      const results = await Promise.allSettled(files.map(uploadImage))
      const uploaded: string[] = []
      const duplicates: string[] = []
      const failed: string[] = []
      for (const [i, result] of results.entries()) {
        if (result.status === 'fulfilled') {
          uploaded.push(result.value)
        } else if (isDuplicateBlobError(result.reason)) {
          duplicates.push(files[i]?.name ?? 'unknown')
        } else {
          failed.push(files[i]?.name ?? 'unknown')
        }
      }
      if (uploaded.length > 0) {
        onChange([...values, ...uploaded])
      }
      if (duplicates.length > 0) {
        toast.error(`A file with the same name already exists: ${duplicates.join(', ')}`)
      }
      if (failed.length > 0) {
        toast.error(`Failed to upload: ${failed.join(', ')}`)
      }
    } finally {
      setIsUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const removeAt = (index: number) => {
    onChange(values.filter((_, i) => i !== index))
  }

  return (
    <div className='space-y-3'>
      <input
        ref={inputRef}
        id={inputId}
        type='file'
        accept={ACCEPT_ATTR}
        multiple
        className='hidden'
        onChange={(event) => void handleFiles(event.target.files)}
      />
      {values.length > 0 && (
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          {values.map((url, index) => (
            <div
              key={url}
              className='relative aspect-square overflow-hidden rounded-[10px] border border-border'
            >
              <Image src={url} alt='' fill className='object-cover' sizes='200px' />
              <button
                type='button'
                aria-label='Remove photo'
                disabled={disabled || isUploading}
                onClick={() => removeAt(index)}
                className='absolute top-1.5 right-1.5 rounded-full bg-background/85 p-1 text-foreground shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground'
              >
                <X aria-hidden='true' className='h-3.5 w-3.5' />
              </button>
            </div>
          ))}
        </div>
      )}
      <Button
        type='button'
        variant='outline'
        size='sm'
        disabled={disabled || isUploading || atCapacity}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? (
          <Loader2 aria-hidden='true' className='h-4 w-4 animate-spin' />
        ) : (
          <ImagePlus aria-hidden='true' className='h-4 w-4' />
        )}
        {atCapacity ? 'Gallery full' : isUploading ? 'Uploading…' : 'Add photos'}
      </Button>
      <p className='font-mono text-[0.58rem] text-foreground/45 tracking-wider'>
        {values.length}/{maxImages} photos
      </p>
    </div>
  )
}
