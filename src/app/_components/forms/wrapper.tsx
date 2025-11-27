import { useDisablePageScroll } from '~/app/_components/hooks'

type SidePaneWrapperProps = {
  children: React.ReactNode
}

export default function SidePaneWrapper({ children }: SidePaneWrapperProps) {
  useDisablePageScroll()
  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="fixed inset-y-0 right-0 w-full overflow-y-auto bg-white sm:w-[525px]">
        {children}
      </div>
    </div>
  )
}
