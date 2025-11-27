import { useToggleGuestForm } from '~/app/_components/contexts/guest-form-context'
import { sharedStyles } from '~/app/utils/shared-styles'

type AddFormButtonsProps = {
  isCreatingGuests: boolean
  shouldCloseAfterSave?: boolean
  onSaveIntentChange?: (shouldClose: boolean) => void
}

export default function AddFormButtons({
  isCreatingGuests,
  shouldCloseAfterSave,
  onSaveIntentChange,
}: AddFormButtonsProps) {
  const toggleGuestForm = useToggleGuestForm()
  return (
    <div
      className={`fixed bottom-0 z-20 flex ${sharedStyles.sidebarFormWidth} flex-col gap-3 border-t bg-white px-3 py-5`}
    >
      <div className="flex gap-3 text-sm">
        <button
          id="save-household-close"
          type="submit"
          name="add-button"
          disabled={isCreatingGuests}
          onClick={() => onSaveIntentChange?.(true)}
          className={`w-1/2 ${sharedStyles.secondaryButton({
            py: 'py-2',
            isLoading: isCreatingGuests,
          })}`}
        >
          {isCreatingGuests ? 'Processing...' : 'Save & Close'}
        </button>
        <button
          id="save-household-another"
          type="submit"
          name="add-button"
          disabled={isCreatingGuests}
          className={`w-1/2 ${sharedStyles.primaryButton({
            px: 'px-2',
            py: 'py-2',
            isLoading: isCreatingGuests,
          })}`}
          onClick={() => onSaveIntentChange?.(false)}
        >
          {isCreatingGuests ? 'Processing...' : 'Save & Add Another Guest'}
        </button>
      </div>
      <button
        type="button"
        onClick={() => toggleGuestForm()}
        disabled={isCreatingGuests}
        className={`text-sm font-semibold ${
          isCreatingGuests ? 'cursor-not-allowed' : 'hover:underline'
        } ${isCreatingGuests ? 'text-pink-200' : `text-${sharedStyles.primaryColor}`}`}
      >
        Cancel
      </button>
    </div>
  )
}
