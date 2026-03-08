import { sharedStyles } from '~/app/utils/shared-styles'
import SidePaneWrapper from '~/components/forms/wrapper'

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
      <div className='flex h-screen flex-col justify-center gap-3 px-7 text-center'>
        <h1 className='font-semibold text-xl'>Are you sure?</h1>
        {disclaimerText && <p>{disclaimerText}</p>}
        <div className='mt-4 flex gap-5'>
          <button
            type='button'
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
            type='button'
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
