import 'cropperjs/dist/cropper.css'

import { type Dispatch, type SetStateAction, useRef } from 'react'
import Cropper, { type ReactCropperElement } from 'react-cropper'
import { GrRotateLeft, GrRotateRight } from 'react-icons/gr'
import { sharedStyles } from '~/app/utils/shared-styles'
import type { CoverPhoto } from '~/app/utils/shared-types'
import { useDisablePageScroll } from '~/components/hooks'
import { LoadingSpinner } from '~/components/loaders'

export default function ImageCropperModal({
  coverPhoto,
  setCoverPhoto,
  isUploading,
}: {
  coverPhoto: CoverPhoto[]
  setCoverPhoto: Dispatch<SetStateAction<CoverPhoto[]>>
  isUploading: boolean
}) {
  useDisablePageScroll()
  const cropperRef = useRef<ReactCropperElement>(null)

  return (
    <div className='bg fixed top-0 left-0 z-50 flex h-screen w-screen items-center justify-center bg-transparent/[0.5]'>
      <div className='h-[700px] w-[800px] rounded-md bg-white px-9 py-12'>
        <div className='flex items-center justify-between gap-5'>
          <h1 className='font-semibold text-2xl'>Adjust Photo</h1>
          <div className='flex gap-3'>
            <GrRotateLeft
              size={24}
              className='cursor-pointer'
              onClick={() => cropperRef.current?.cropper.rotate(-90)}
            />
            <GrRotateRight
              size={24}
              className='cursor-pointer'
              onClick={() => cropperRef.current?.cropper.rotate(90)}
            />
          </div>
        </div>

        <div className='my-5 flex h-[500px] w-full items-center bg-black'>
          {coverPhoto[0] && (
            <Cropper
              key={coverPhoto[0].name}
              src={coverPhoto[0].preview}
              className='h-[400px] w-full'
              ref={cropperRef}
              background={false}
              viewMode={1}
              aspectRatio={18 / 9}
              autoCropArea={1}
              responsive={true}
              zoomable={false}
              cropBoxResizable={false}
              dragMode='none'
            />
          )}
        </div>
        {/* <img style={{ width: "100%" }} src={cropData} alt="cropped" /> */}
        <div className='flex justify-end gap-3'>
          <button
            type='button'
            disabled={isUploading}
            className={sharedStyles.secondaryButton({
              py: 'py-2',
              isLoading: isUploading,
            })}
            onClick={() => setCoverPhoto([])}
          >
            Cancel Changes
          </button>
          <button
            type='submit'
            disabled={isUploading}
            className={`${sharedStyles.primaryButton({ py: 'py-2', isLoading: isUploading })} min-w-48 text-center`}
            // TODO: cropped photo is uploading successfully to s3 but something gets corrupted along the way, so the objectURL fails to display the cropped image; hunch is something with how the dataUrlToFile function converts the croppedCanvas to a file
            // onClick={() => {
            //   getCropData();
            //   setCoverPhoto((prev) => [
            //     dataUrlToFile(
            //       cropperRef?.current?.cropper
            //         .getCroppedCanvas()
            //         .toDataURL() ?? "",
            //       prev[0]!.name,
            //     ),
            //   ]);
            // }}
          >
            {isUploading ? <LoadingSpinner size={24} useAccentColor={true} /> : 'Crop Photo'}
          </button>
        </div>
      </div>
    </div>
  )
}
