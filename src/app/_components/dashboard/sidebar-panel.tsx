import { type Dispatch, type SetStateAction } from 'react'

import { sharedStyles } from '~/app/utils/shared-styles'

type SidebarPanelProps = {
  setShowWebsiteSettings: Dispatch<SetStateAction<boolean>>
}

export default function SidebarPanel({ setShowWebsiteSettings }: SidebarPanelProps) {
  return (
    <section className="px-3">
      <div className="flex items-end justify-between border-b pb-8">
        <h2 className="text-xl font-semibold">Your Theme</h2>
        <span
          className={`text-${sharedStyles.primaryColor} cursor-pointer text-lg hover:underline`}
        >
          Browse Themes
        </span>
      </div>
      <div className="flex items-end justify-between border-b py-8">
        <h2 className="text-xl font-semibold">Privacy Settings</h2>
        <span
          className={`text-${sharedStyles.primaryColor} cursor-pointer text-lg hover:underline`}
          onClick={() => setShowWebsiteSettings(true)}
        >
          Manage
        </span>
      </div>
    </section>
  )
}
