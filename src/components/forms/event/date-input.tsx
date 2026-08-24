type DateInputProps = {
  eventDate: string | undefined
  handleOnChange: ({ field, inputValue }: { field: string; inputValue: string }) => void
}

export default function DateInput({ eventDate, handleOnChange }: DateInputProps) {
  return (
    <div className='relative'>
      <input
        id='event-date'
        type='date'
        required={(eventDate?.length ?? 0) > 0}
        placeholder='MM/DD/YYYY'
        value={eventDate}
        onChange={(e) => handleOnChange({ field: 'date', inputValue: e.target.value })}
        className='peer w-full rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-0'
      />
      <label
        htmlFor='event-date'
        className='absolute start-1 top-2 left-2 z-10 origin-[0] -translate-y-5 scale-75 bg-background px-2 peer-focus:text-primary'
      >
        Date
      </label>
    </div>
  )
}
