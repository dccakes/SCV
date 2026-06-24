'use client'

/**
 * WebsiteMediaEditor
 *
 * Editor card for the wedding website's imagery: the full-width header/hero
 * image shown at the top of every guest surface, and a gallery of couple
 * photos shown on the home page. Each control saves independently through its
 * own tRPC mutation so a slow upload never blocks the other.
 */

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { ImageGalleryUpload, SingleImageUpload } from '~/app/_components/website/image-upload'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { api } from '~/trpc/react'

const MAX_COUPLE_IMAGES = 12
const labelClass = 'font-mono text-[0.6rem] text-foreground/55 uppercase tracking-[0.18em]'

type WebsiteMediaEditorProps = Readonly<{
  initialHeaderImageUrl: string | null
  initialCoupleImageUrls: string[]
}>

export function WebsiteMediaEditor({
  initialHeaderImageUrl,
  initialCoupleImageUrls,
}: WebsiteMediaEditorProps) {
  const router = useRouter()
  const [headerImageUrl, setHeaderImageUrl] = useState(initialHeaderImageUrl)
  const [coupleImageUrls, setCoupleImageUrls] = useState(initialCoupleImageUrls)

  const updateHeaderImage = api.website.updateHeaderImage.useMutation({
    onError: () => toast.error('Unable to save the header image.'),
    onSuccess: () => {
      toast.success('Header image saved')
      router.refresh()
    },
  })

  const updateCoupleImages = api.website.updateCoupleImages.useMutation({
    onError: () => toast.error('Unable to save your couple photos.'),
    onSuccess: () => {
      toast.success('Couple photos saved')
      router.refresh()
    },
  })

  const headerChanged = headerImageUrl !== initialHeaderImageUrl
  const galleryChanged = JSON.stringify(coupleImageUrls) !== JSON.stringify(initialCoupleImageUrls)

  return (
    <Card className='border-border/80 bg-card/80'>
      <CardHeader className='space-y-2'>
        <p className={labelClass}>Photos</p>
        <h3 className='font-serif text-2xl text-foreground'>Add your photos</h3>
        <p className='max-w-2xl font-sans text-muted-foreground text-sm leading-6'>
          The header image appears at the top of every page guests visit. Couple photos appear on
          your home page. Your selected template styles them automatically.
        </p>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='space-y-2'>
          <span className={labelClass}>Header image</span>
          <SingleImageUpload
            value={headerImageUrl}
            onChange={setHeaderImageUrl}
            aspectClassName='aspect-[21/9]'
            label='Upload header image'
            disabled={updateHeaderImage.isPending}
          />
          <div className='flex justify-end'>
            <Button
              size='sm'
              disabled={!headerChanged || updateHeaderImage.isPending}
              onClick={() => updateHeaderImage.mutate({ headerImageUrl })}
            >
              {updateHeaderImage.isPending ? 'Saving…' : 'Save header'}
            </Button>
          </div>
        </div>

        <div className='space-y-2'>
          <span className={labelClass}>Couple photos</span>
          <ImageGalleryUpload
            values={coupleImageUrls}
            onChange={setCoupleImageUrls}
            maxImages={MAX_COUPLE_IMAGES}
            disabled={updateCoupleImages.isPending}
          />
          <div className='flex justify-end'>
            <Button
              size='sm'
              disabled={!galleryChanged || updateCoupleImages.isPending}
              onClick={() => updateCoupleImages.mutate({ coupleImageUrls })}
            >
              {updateCoupleImages.isPending ? 'Saving…' : 'Save photos'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
