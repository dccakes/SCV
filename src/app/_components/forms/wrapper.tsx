import { useDisablePageScroll } from '~/app/_components/hooks'
import { sharedStyles } from '~/app/utils/shared-styles'

type SidePaneWrapperProps = {
  children: React.ReactNode
}

export default function SidePaneWrapper({ children }: SidePaneWrapperProps) {
  useDisablePageScroll()
  return (
    <div className="fixed left-0 top-0 z-50 flex h-screen w-screen justify-end overflow-y-auto bg-transparent/[0.5]">
      <div className="h-screen bg-white">
        <div className={`relative h-fit ${sharedStyles.sidebarFormWidth} bg-white`}>{children}</div>
      </div>
    </div>
  )
}
