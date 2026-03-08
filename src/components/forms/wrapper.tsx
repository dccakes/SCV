import { useDisablePageScroll } from '~/components/hooks'
import {
  SIDE_PANE_FORM_WIDTH_CLASS,
  SIDE_PANE_OVERLAY_CLASS,
  SIDE_PANE_SURFACE_CLASS,
} from '~/components/layout/side-pane-styles'

type SidePaneWrapperProps = {
  children: React.ReactNode
}

export default function SidePaneWrapper({ children }: SidePaneWrapperProps) {
  useDisablePageScroll()
  return (
    <div className={`fixed inset-0 z-50 ${SIDE_PANE_OVERLAY_CLASS}`}>
      <div
        className={`fixed inset-y-0 right-0 w-full ${SIDE_PANE_SURFACE_CLASS} ${SIDE_PANE_FORM_WIDTH_CLASS}`}
      >
        {children}
      </div>
    </div>
  )
}
