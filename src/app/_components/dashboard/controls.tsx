import { type Dispatch, type SetStateAction } from 'react'
import { BiCollapseVertical } from 'react-icons/bi'
import { HiOutlineArrowsUpDown } from 'react-icons/hi2'
import { RiExpandUpDownLine } from 'react-icons/ri'

import { sharedStyles } from '~/app/utils/shared-styles'

type DashboardControlsProps = {
  collapseSections: boolean
  setCollapseSections: Dispatch<SetStateAction<boolean>>
}

export default function DashboardControls({
  collapseSections,
  setCollapseSections,
}: DashboardControlsProps) {
  return (
    <div className="flex items-center">
      <div className="flex cursor-pointer">
        <HiOutlineArrowsUpDown size={21} color={sharedStyles.primaryColorHex} />
        <button className={`text-${sharedStyles.primaryColor} mx-2`}>Reorder</button>
      </div>
      <div className="flex cursor-pointer" onClick={() => setCollapseSections((prev) => !prev)}>
        {collapseSections ? (
          <>
            <RiExpandUpDownLine size={21} color={sharedStyles.primaryColorHex} />
            <button className={`text-${sharedStyles.primaryColor}`}>Expand All</button>
          </>
        ) : (
          <>
            <BiCollapseVertical size={21} color={sharedStyles.primaryColorHex} />
            <button className={`text-${sharedStyles.primaryColor}`}>Collapse All</button>
          </>
        )}
      </div>
    </div>
  )
}
