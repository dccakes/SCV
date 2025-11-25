import { type Dispatch, type SetStateAction } from 'react'

import { useToggleGuestForm } from '~/app/_components/contexts/guest-form-context'
import { sharedStyles } from '~/app/utils/shared-styles'

type EditFormButtonsProps = {
  isUpdatingHousehold: boolean
  setShowDeleteConfirmation: Dispatch<SetStateAction<boolean>>
}

export default function EditFormButtons({
  isUpdatingHousehold,
  setShowDeleteConfirmation,
}: EditFormButtonsProps) {
  const toggleGuestForm = useToggleGuestForm()

  return (
    <div
      className={`fixed bottom-0 z-20 flex ${sharedStyles.sidebarFormWidth} flex-col gap-3 border-t bg-white px-3 py-5`}
    >
      <div className="flex gap-3 text-sm">
        <button
          disabled={isUpdatingHousehold}
          onClick={() => toggleGuestForm()}
          className={`w-1/2 ${sharedStyles.secondaryButton({
            py: 'py-2',
            isLoading: isUpdatingHousehold,
          })}`}
        >
          Cancel
        </button>
        <button
          id="edit-save"
          name="edit-button"
          type="submit"
          disabled={isUpdatingHousehold}
          className={`w-1/2 ${sharedStyles.primaryButton({
            px: 'px-2',
            py: 'py-2',
            isLoading: isUpdatingHousehold,
          })}`}
        >
          {isUpdatingHousehold ? 'Processing...' : 'Save'}
        </button>
      </div>
      <button
        onClick={(e) => {
          e.preventDefault()
          setShowDeleteConfirmation(true)
        }}
        className={`text-sm font-bold ${
          isUpdatingHousehold ? 'cursor-not-allowed' : 'hover:underline'
        } ${isUpdatingHousehold ? 'text-pink-200' : `text-${sharedStyles.primaryColor}`}`}
      >
        {isUpdatingHousehold ? 'Processing...' : 'Delete Party'}
      </button>
    </div>
  )
}
