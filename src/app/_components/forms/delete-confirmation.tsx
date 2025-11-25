import SidePaneWrapper from '~/app/_components/forms/wrapper'
import { sharedStyles } from '~/app/utils/shared-styles'

type DeleteConfirmationProps = {
  isProcessing: boolean
  disclaimerText: string
  noHandler: () => void
  yesHandler: () => void
}

export default function DeleteConfirmation({
  isProcessing,
  disclaimerText,
  noHandler,
  yesHandler,
}: DeleteConfirmationProps) {
  return (
    <SidePaneWrapper>
      <div className="flex h-screen flex-col justify-center gap-3 px-7 text-center">
        <h1 className="text-xl font-semibold">Are you sure?</h1>
        {disclaimerText && <p>{disclaimerText}</p>}
        <div className="mt-4 flex gap-5">
          <button
            disabled={isProcessing}
            onClick={() => noHandler()}
            className={`${sharedStyles.secondaryButton({
              py: 'py-2',
              isLoading: isProcessing,
            })} w-1/2 ${isProcessing ? 'text-pink-200' : `text-${sharedStyles.primaryColor}`}`}
          >
            No
          </button>
          <button
            disabled={isProcessing}
            className={`w-1/2 ${sharedStyles.primaryButton({
              py: 'py-2',
              isLoading: isProcessing,
            })}`}
            onClick={() => yesHandler()}
          >
            {isProcessing ? 'Processing...' : 'Yes'}
          </button>
        </div>
      </div>
    </SidePaneWrapper>
  )
}
