import type { Dispatch, SetStateAction } from 'react'
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
    <div className='flex items-center gap-4'>
      <div className='flex cursor-pointer items-center gap-1 text-primary text-sm transition-colors hover:text-primary/80'>
        <HiOutlineArrowsUpDown size={16} className='text-primary' />
        <button type='button'>Reorder</button>
      </div>
      <button
        type='button'
        className='flex cursor-pointer items-center gap-1 text-primary text-sm transition-colors hover:text-primary/80'
        onClick={() => setCollapseSections((prev) => !prev)}
      >
        {collapseSections ? (
          <>
            <RiExpandUpDownLine size={16} className='text-primary' />
            <span>Expand All</span>
          </>
        ) : (
          <>
            <BiCollapseVertical size={16} className='text-primary' />
            <span>Collapse All</span>
          </>
        )}
      </button>
    </div>
  )
}
