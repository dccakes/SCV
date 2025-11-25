'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { type FileWithPath, useDropzone } from 'react-dropzone'
import { AiOutlinePlusCircle } from 'react-icons/ai'

import ImageCropperModal from '~/app/_components/dashboard/cropper-modal'
import { sharedStyles } from '~/app/utils/shared-styles'
import { type CoverPhoto } from '~/app/utils/shared-types'

export default function CoverPhotoUploader({
  uploadImage,
}: {
  uploadImage: (formData: FormData) => Promise<{ ok: boolean }>
}) {
  const router = useRouter()
  const [coverPhoto, setCoverPhoto] = useState<CoverPhoto[]>([])
  const [isUploading, setIsUploading] = useState<boolean>(false)

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    if (acceptedFiles?.length) {
      setCoverPhoto(
        acceptedFiles.map((file) => Object.assign(file, { preview: URL.createObjectURL(file) }))
      )
    }
  }, [])

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': [],
    },
    maxSize: 1024 * 1000,
    maxFiles: 1,
    onDrop,
  })

  useEffect(() => {
    // Revoke the data uris to avoid memory leaks
    return () => coverPhoto.forEach((photo) => URL.revokeObjectURL(photo.preview ?? ''))
  }, [coverPhoto])

  const upload = async () => {
    setIsUploading(true)
    const file = coverPhoto[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', file.name)
    formData.append('type', file.type)
    const { ok } = await uploadImage(formData)
    setIsUploading(false)
    if (ok) {
      setCoverPhoto([])
      router.refresh()
    }
  }

  return (
    <form action={() => void upload()}>
      {coverPhoto.length > 0 && (
        <ImageCropperModal
          coverPhoto={coverPhoto}
          setCoverPhoto={setCoverPhoto}
          isUploading={isUploading}
        />
      )}
      <input {...getInputProps({ name: 'file' })} />
      <div {...getRootProps({ className: 'dropzone px-10' })}>
        <div className="flex cursor-pointer items-center justify-center border py-16 transition-colors duration-300 ease-in-out hover:bg-gray-100">
          <div className="flex">
            <AiOutlinePlusCircle size={25} color={sharedStyles.primaryColorHex} />
            <p className={`pl-3 text-${sharedStyles.primaryColor}`}>Add a Cover Photo</p>
          </div>
        </div>
      </div>
    </form>
  )
}
