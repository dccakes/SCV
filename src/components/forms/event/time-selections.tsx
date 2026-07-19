'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { generateTimes } from '~/app/utils/helpers'
import { useOuterClick } from '~/components/hooks'

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
  const startTimeRef = useOuterClick<HTMLButtonElement>(() => setShowStartTimes(false))
  const endTimeRef = useOuterClick<HTMLButtonElement>(() => setShowEndTimes(false))

  return (
    <div className='flex gap-3'>
      <div
        className={`relative h-12 w-1/2 rounded-lg border ${showStartTimes && 'border-primary'}`}
      >
        <button
          type='button'
          ref={startTimeRef}
          onClick={() => setShowStartTimes((prev) => !prev)}
          className='flex w-full cursor-pointer items-center justify-between p-3'
        >
          <span
            className={`absolute start-1 top-2 left-2 z-10 origin-[0] -translate-y-5 scale-75 bg-background px-2 ${showStartTimes && 'text-primary'}`}
          >
            Start Time
          </span>
          <span>{startTime ?? 'Select Time'}</span>
          {showStartTimes ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          {showStartTimes && (
            <TimeDropdown
              isOpen={showStartTimes}
              field='startTime'
              selectedTime={startTime ?? ''}
              handleOnChange={handleOnChange}
            />
          )}
        </button>
      </div>
      <div className={`relative h-12 w-1/2 rounded-lg border ${showEndTimes && 'border-primary'}`}>
        <button
          type='button'
          ref={endTimeRef}
          onClick={() => setShowEndTimes((prev) => !prev)}
          className='flex w-full cursor-pointer items-center justify-between p-3'
        >
          <span
            className={`absolute start-1 top-2 left-2 z-10 origin-[0] -translate-y-5 scale-75 bg-background px-2 ${showEndTimes && 'text-primary'}`}
          >
            End Time
          </span>
          <span>{endTime ?? 'Select Time'}</span>
          {showEndTimes ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          {showEndTimes && (
            <TimeDropdown
              isOpen={showEndTimes}
              field='endTime'
              selectedTime={endTime ?? ''}
              handleOnChange={handleOnChange}
            />
          )}
        </button>
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
  useEffect(() => {
    document.getElementsByClassName('selected-startTime')[0]?.scrollIntoView()
    document.getElementsByClassName('selected-endTime')[0]?.scrollIntoView()
  }, [])

  return (
    <div
      className={`absolute top-12 left-0 z-20 h-60 w-full overflow-auto rounded-lg border border-primary bg-background ${isOpen ?? 'border-primary'}`}
    >
      <ul>
        {times.map((time) => (
          <li key={time}>
            <button
              type='button'
              className={`w-full p-4 text-left text-lg hover:bg-primary/10 hover:underline ${selectedTime === time && `selected-${field} bg-primary/10 font-bold`}`}
              onClick={() => handleOnChange({ field, inputValue: time })}
            >
              {time}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
