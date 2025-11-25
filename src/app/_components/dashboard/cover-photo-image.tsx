'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BsPencil, BsTrash3 } from 'react-icons/bs'

import { LoadingSpinner } from '~/app/_components/loaders'
import { sharedStyles } from '~/app/utils/shared-styles'
import { useToast } from '~/components/ui/use-toast'

type CoverPhotoImageProps = {
  coverPhotoUrl: string
  deleteImage: (imageKey: string) => Promise<{ ok: boolean }>
}

export default function CoverPhotoImage({ coverPhotoUrl, deleteImage }: CoverPhotoImageProps) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const router = useRouter()
  const handleDeleteCoverPhoto = async () => {
    setIsDeleting(true)
    const coverPhotoKey = coverPhotoUrl.slice(coverPhotoUrl.lastIndexOf('/') + 1)
    const { ok } = await deleteImage(coverPhotoKey)
    if (ok) {
      router.refresh()
    } else {
      toast({
        description: 'Failed to delete cover photo! Try again.',
        variant: 'destructive',
      })
    }
    setIsDeleting(false)
  }
  return (
    <div
      className="relative aspect-video h-auto w-full"
      onMouseOver={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Image src={coverPhotoUrl} layout="fill" objectFit="contain" alt="Website Cover Photo" />
      {showActions && (
        <div className="group absolute left-0 top-0 flex aspect-video h-auto w-full items-center justify-center bg-transparent/75 opacity-0 transition-all duration-300 ease-in-out hover:opacity-100">
          <div className="flex gap-20">
            <button
              type="button"
              disabled={isDeleting}
              className="-translate-y-36 text-white transition-all duration-500 group-hover:translate-y-0"
            >
              <div className={`rounded-full bg-${sharedStyles.primaryColor} p-4`}>
                <BsPencil size={32} color="white" />
              </div>
              Edit
            </button>
            {isDeleting ? (
              <div className="flex items-center justify-center p-4">
                <LoadingSpinner size={40} />
              </div>
            ) : (
              <button
                type="button"
                disabled={isDeleting}
                className="translate-y-36 text-white transition-all duration-500 group-hover:translate-y-0"
                onClick={handleDeleteCoverPhoto}
              >
                <div className="rounded-full border-2 border-white p-4">
                  <BsTrash3 size={32} color="white" />
                </div>
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
