import { type Dispatch, type SetStateAction } from 'react'
import { BiCollapseVertical } from 'react-icons/bi'
import { HiOutlineArrowsUpDown } from 'react-icons/hi2'
import { RiExpandUpDownLine } from 'react-icons/ri'

type DashboardControlsProps = {
  collapseSections: boolean
  setCollapseSections: Dispatch<SetStateAction<boolean>>
}

export default function DashboardControls({
  collapseSections,
  setCollapseSections,
}: DashboardControlsProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex cursor-pointer items-center gap-1 text-sm text-primary transition-colors hover:text-primary/80">
        <HiOutlineArrowsUpDown size={16} className="text-primary" />
        <button>Reorder</button>
      </div>
      <div
        className="flex cursor-pointer items-center gap-1 text-sm text-primary transition-colors hover:text-primary/80"
        onClick={() => setCollapseSections((prev) => !prev)}
      >
        {collapseSections ? (
          <>
            <RiExpandUpDownLine size={16} className="text-primary" />
            <button>Expand All</button>
          </>
        ) : (
          <>
            <BiCollapseVertical size={16} className="text-primary" />
            <button>Collapse All</button>
          </>
        )}
      </div>
    </div>
  )
}
