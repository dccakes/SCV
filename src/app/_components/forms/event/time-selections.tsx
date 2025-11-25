'use client'

import { useEffect, useState } from 'react'
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io'

import { useOuterClick } from '~/app/_components/hooks'
import { generateTimes } from '~/app/utils/helpers'

type TimeSelectionsProps = {
  startTime: string | undefined
  endTime: string | undefined
  handleOnChange: ({ field, inputValue }: { field: string; inputValue: string }) => void
}

export default function TimeSelections({
  startTime,
  endTime,
  handleOnChange,
}: TimeSelectionsProps) {
  const [showStartTimes, setShowStartTimes] = useState<boolean>(false)
  const [showEndTimes, setShowEndTimes] = useState<boolean>(false)
  const startTimeRef = useOuterClick(() => setShowStartTimes(false))
  const endTimeRef = useOuterClick(() => setShowEndTimes(false))

  return (
    <div className="flex gap-3">
      <div
        className={`relative h-12 w-1/2 rounded-lg border ${showStartTimes && 'border-pink-400'}`}
      >
        <div
          ref={startTimeRef}
          onClick={() => setShowStartTimes((prev) => !prev)}
          className="flex cursor-pointer items-center justify-between p-3"
        >
          <span
            className={`absolute left-2 start-1 top-2 z-10 origin-[0] -translate-y-5 scale-75 bg-white px-2 ${showStartTimes && 'text-pink-400'}`}
          >
            Start Time
          </span>
          <span>{startTime ?? 'Select Time'}</span>
          {showStartTimes ? <IoIosArrowUp size={20} /> : <IoIosArrowDown size={20} />}
          {showStartTimes && (
            <TimeDropdown
              isOpen={showStartTimes}
              field="startTime"
              selectedTime={startTime ?? ''}
              handleOnChange={handleOnChange}
            />
          )}
        </div>
      </div>
      <div className={`relative h-12 w-1/2 rounded-lg border ${showEndTimes && 'border-pink-400'}`}>
        <div
          ref={endTimeRef}
          onClick={() => setShowEndTimes((prev) => !prev)}
          className="flex cursor-pointer items-center justify-between p-3"
        >
          <span
            className={`absolute left-2 start-1 top-2 z-10 origin-[0] -translate-y-5 scale-75 bg-white px-2 ${showEndTimes && 'text-pink-400'}`}
          >
            End Time
          </span>
          <span>{endTime ?? 'Select Time'}</span>
          {showEndTimes ? <IoIosArrowUp size={20} /> : <IoIosArrowDown size={20} />}
          {showEndTimes && (
            <TimeDropdown
              isOpen={showEndTimes}
              field="endTime"
              selectedTime={endTime ?? ''}
              handleOnChange={handleOnChange}
            />
          )}
        </div>
      </div>
    </div>
  )
}

type TimeDropdownProps = {
  isOpen: boolean
  field: string
  selectedTime: string
  handleOnChange: ({ field, inputValue }: { field: string; inputValue: string }) => void
}

const TimeDropdown = ({ isOpen, field, selectedTime, handleOnChange }: TimeDropdownProps) => {
  const times = generateTimes()
  const handleChangeOption = (e: React.MouseEvent<HTMLLIElement>, field: string) => {
    const target = e.target as HTMLElement
    handleOnChange({ field, inputValue: target.innerText })
  }
  useEffect(() => {
    document.getElementsByClassName('selected-startTime')[0]?.scrollIntoView()
    document.getElementsByClassName('selected-endTime')[0]?.scrollIntoView()
  }, [])

  return (
    <div
      className={`absolute left-0 top-12 z-20 h-60 w-full overflow-auto rounded-lg border border-b-pink-400 border-l-pink-400 border-r-pink-400 bg-white ${isOpen ?? 'border-pink-400'}`}
    >
      <ul>
        {times.map((time) => (
          <li
            key={time}
            className={`p-4 text-lg hover:bg-pink-100 hover:underline ${selectedTime === time && `selected-${field} bg-pink-100 font-bold`}`}
            onClick={(e) => handleChangeOption(e, field)}
          >
            {time}
          </li>
        ))}
      </ul>
    </div>
  )
}
