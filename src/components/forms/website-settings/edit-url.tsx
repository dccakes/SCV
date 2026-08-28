'use client'

import { useRouter } from 'next/navigation'
import { type Dispatch, type SetStateAction, useState } from 'react'
import { GoArrowLeft } from 'react-icons/go'
import { toast } from 'sonner'
import { sharedStyles } from '~/app/utils/shared-styles'
import AnimatedInputLabel from '~/components/forms/animated-input-label'
import { api } from '~/trpc/react'

type EditUrlViewProps = {
  setShowEditUrlView: Dispatch<SetStateAction<boolean>>
  websiteUrl: string
}

export default function EditUrlView({ setShowEditUrlView, websiteUrl }: EditUrlViewProps) {
  const [urlInput, setUrlInput] = useState(websiteUrl ?? '')
  const router = useRouter()

  const updateWebsite = api.website.update.useMutation({
    onSuccess: () => {
      setShowEditUrlView(false)
      router.refresh()
    },
    onError: (err) => {
      toast.error('Failed to update website URL', {
        description: err.message ?? 'Please try again later.',
      })
    },
  })

  const handleOnChange = ({ inputValue }: { inputValue: string }) => {
    setUrlInput(inputValue)
  }

  return (
    <div>
      <div className='flex justify-between border-b p-5'>
        <div className='flex gap-4'>
          <button
            type='button'
            className='cursor-pointer'
            onClick={() => setShowEditUrlView(false)}
          >
            <GoArrowLeft size={28} />
          </button>
          <span className='border-r'></span>
          <h1 className='font-bold text-2xl'>Edit URL</h1>
        </div>
      </div>

      <div className='mt-7 px-5'>
        <AnimatedInputLabel
          id={'edit-url'}
          inputValue={urlInput}
          labelText={window.location.host}
          handleOnChange={handleOnChange}
        />
      </div>

      <div
        className={`fixed bottom-0 flex flex-col gap-3 border-t px-8 py-5 ${sharedStyles.sidebarFormWidth}`}
      >
        <button
          type='button'
          disabled={updateWebsite.isPending}
          className={`w-[100%] ${sharedStyles.primaryButton({
            py: 'py-2',
            isLoading: updateWebsite.isPending,
          })}`}
          onClick={() =>
            updateWebsite.mutate({
              subUrl: urlInput,
            })
          }
        >
          {updateWebsite.isPending ? 'Processing...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
