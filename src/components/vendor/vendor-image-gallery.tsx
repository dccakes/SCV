'use client'

import { Camera, Plus, Star, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { VendorImagePicker } from '~/components/vendor/vendor-image-picker'
import { uploadFiles } from '~/lib/blob'
import { MAX_IMAGES_PER_VENDOR } from '~/lib/upload-config'
import type { VendorImage } from '~/server/domains/vendor/vendor.types'
import { api } from '~/trpc/react'

type VendorImageGalleryProps = Readonly<{
  images: VendorImage[]
  vendorId: string
  hasWebsite: boolean
}>

async function proxyDownloadImage(
  url: string,
  vendorId: string
): Promise<{ url: string; key: string; size: number; name: string } | null> {
  try {
    const res = await fetch('/api/vendor/proxy-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, vendorId }),
    })
    if (!res.ok) return null
    return res.json() as Promise<{ url: string; key: string; size: number; name: string }>
  } catch {
    return null
  }
}

export function VendorImageGallery({ images, vendorId, hasWebsite }: VendorImageGalleryProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const utils = api.useUtils()

  const saveImages = api.vendor.saveImages.useMutation({
    onSuccess: async () => {
      await utils.vendor.getById.invalidate({ vendorId })
      toast.success('Images saved')
    },
    onError: () => toast.error('Failed to save images'),
  })

  const deleteImage = api.vendor.deleteImage.useMutation({
    onSuccess: async () => {
      await utils.vendor.getById.invalidate({ vendorId })
      toast.success('Image removed')
    },
    onError: () => toast.error('Failed to remove image'),
  })

  const setCoverImage = api.vendor.setCoverImage.useMutation({
    onSuccess: async () => {
      await utils.vendor.getById.invalidate({ vendorId })
      toast.success('Cover image updated')
    },
    onError: () => toast.error('Failed to update cover image'),
  })

  const fetchWebsiteImages = api.vendor.fetchWebsiteImages.useMutation()

  const handleUpload = useCallback(
    async (files: File[]) => {
      if (images.length >= MAX_IMAGES_PER_VENDOR) {
        toast.error(`Maximum ${MAX_IMAGES_PER_VENDOR} images per vendor`)
        return
      }
      const remaining = MAX_IMAGES_PER_VENDOR - images.length
      const toUpload = files.slice(0, remaining)

      setIsUploading(true)
      try {
        const results = await uploadFiles(toUpload)
        await saveImages.mutateAsync({
          vendorId,
          images: results.map((r) => ({
            name: r.name,
            url: r.url,
            key: r.pathname,
            size: r.size,
            source: 'manual' as const,
          })),
        })
      } catch {
        toast.error('Failed to upload images')
      } finally {
        setIsUploading(false)
      }
    },
    [images.length, vendorId, saveImages]
  )

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop: handleUpload,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    noClick: true,
    noKeyboard: true,
    disabled: isUploading,
  })

  const handleFindFromWebsite = async () => {
    try {
      const candidates = await fetchWebsiteImages.mutateAsync({ vendorId })
      if (candidates.length === 0) {
        toast.info('No images found on their website')
        return
      }
      setShowPicker(true)
    } catch {
      toast.error('Could not fetch images from website')
    }
  }

  const handlePickerConfirm = async (selectedUrls: string[]) => {
    setShowPicker(false)
    if (selectedUrls.length === 0) return

    setIsUploading(true)
    try {
      const results = await Promise.all(
        selectedUrls.map((url) => proxyDownloadImage(url, vendorId))
      )
      const validResults = results.filter((r): r is NonNullable<typeof r> => r !== null)
      if (validResults.length === 0) {
        toast.error('Failed to download selected images')
        return
      }
      await saveImages.mutateAsync({
        vendorId,
        images: validResults.map((r) => ({
          ...r,
          source: 'website' as const,
        })),
      })
    } catch {
      toast.error('Failed to save images from website')
    } finally {
      setIsUploading(false)
    }
  }

  const canAddMore = images.length < MAX_IMAGES_PER_VENDOR

  return (
    <div {...getRootProps()} className='outline-none'>
      <input {...getInputProps()} />

      {images.length === 0 ? (
        <div className='flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border p-6 text-center'>
          <Camera className='h-8 w-8 text-muted-foreground/40' />
          <p className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
            No photos yet
          </p>
          <div className='flex gap-2'>
            <Button type='button' variant='outline' size='sm' onClick={open} disabled={isUploading}>
              Upload photos
            </Button>
            {hasWebsite && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleFindFromWebsite}
                disabled={fetchWebsiteImages.isPending || isUploading}
              >
                {fetchWebsiteImages.isPending ? 'Finding...' : 'Find from website'}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className='space-y-2'>
          <div className='grid grid-cols-3 gap-2'>
            {images.map((image) => (
              <div
                key={image.id}
                className='group/img relative aspect-square overflow-hidden rounded-md bg-muted'
              >
                <Image
                  src={image.url}
                  alt={image.name}
                  fill
                  className='object-cover'
                  sizes='(max-width: 768px) 33vw, 120px'
                />
                {image.isPrimary && (
                  <div className='absolute left-1 top-1'>
                    <span className='rounded bg-primary/80 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary-foreground'>
                      Cover
                    </span>
                  </div>
                )}
                <div className='absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover/img:opacity-100'>
                  {!image.isPrimary && (
                    <button
                      type='button'
                      aria-label='Set as cover image'
                      onClick={() => setCoverImage.mutate({ vendorId, imageId: image.id })}
                      disabled={setCoverImage.isPending}
                      className='rounded-full bg-white/20 p-1.5 text-white transition-colors hover:bg-white/40'
                    >
                      <Star className='h-3.5 w-3.5' />
                    </button>
                  )}
                  <button
                    type='button'
                    aria-label={`Remove ${image.name}`}
                    onClick={() => deleteImage.mutate({ imageId: image.id, vendorId })}
                    disabled={deleteImage.isPending}
                    className='rounded-full bg-white/20 p-1.5 text-white transition-colors hover:bg-destructive/80'
                  >
                    <Trash2 className='h-3.5 w-3.5' />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {canAddMore && (
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={open}
                disabled={isUploading}
                className='flex items-center gap-1.5 rounded-md border border-dashed border-primary/30 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-primary transition-colors hover:border-primary hover:bg-primary/5'
              >
                <Plus className='h-3 w-3' />
                Add photos
              </button>
              {hasWebsite && (
                <button
                  type='button'
                  onClick={handleFindFromWebsite}
                  disabled={fetchWebsiteImages.isPending || isUploading}
                  className='flex items-center gap-1.5 rounded-md border border-dashed border-border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/30'
                >
                  {fetchWebsiteImages.isPending ? 'Finding...' : 'Find from website'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {showPicker && (
        <VendorImagePicker
          candidates={fetchWebsiteImages.data ?? []}
          maxSelect={MAX_IMAGES_PER_VENDOR - images.length}
          onConfirm={handlePickerConfirm}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
