import { type Dispatch, type SetStateAction } from 'react'
import { FaRegCopy } from 'react-icons/fa'
import { FiEdit2 } from 'react-icons/fi'

import { sharedStyles } from '~/app/utils/shared-styles'
import { useToast } from '~/components/ui/use-toast'

type DashboardHeaderProps = {
  websiteUrl: string | undefined
  setShowWebsiteSettings: Dispatch<SetStateAction<boolean>>
}

export default function DashboardHeader({
  websiteUrl,
  setShowWebsiteSettings,
}: DashboardHeaderProps) {
  const { toast } = useToast()
  return (
    <section className="py-10">
      <div className="flex items-center justify-between">
        <div className="">
          <h1 className="text-3xl font-bold">Your Website</h1>
          <div className="mt-2 flex">
            <p>{websiteUrl}</p>
            <span
              className={`ml-5 cursor-pointer text-${sharedStyles.primaryColor} flex items-center gap-1`}
              onClick={async () => {
                await navigator.clipboard.writeText(websiteUrl ?? '')
                toast({
                  description: 'Website link copied!',
                })
              }}
            >
              <FaRegCopy size={16} color={sharedStyles.primaryColorHex} />
              Copy
            </span>
            <span
              className={`ml-5 cursor-pointer text-${sharedStyles.primaryColor} flex items-center gap-1`}
              onClick={() => setShowWebsiteSettings(true)}
            >
              <FiEdit2 size={16} color={sharedStyles.primaryColorHex} />
              Edit
            </span>
          </div>
        </div>
        <div>
          <button className={sharedStyles.secondaryButton()}>Share your Website</button>
          <button className={`ml-5 ${sharedStyles.primaryButton()}`}>Preview Site</button>
        </div>
      </div>
    </section>
  )
}
