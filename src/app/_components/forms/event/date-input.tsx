type DateInputProps = {
  eventDate: string | undefined
  handleOnChange: ({ field, inputValue }: { field: string; inputValue: string }) => void
}

export default function DateInput({ eventDate, handleOnChange }: DateInputProps) {
  return (
    <div className="relative">
      <input
        id="event-date"
        type="date"
        required={(eventDate?.length ?? 0) > 0}
        placeholder="MM/DD/YYYY"
        value={eventDate}
        onChange={(e) => handleOnChange({ field: 'date', inputValue: e.target.value })}
        className="peer w-full rounded-lg border p-3 focus:border-pink-400 focus:outline-none focus:ring-0 dark:focus:border-pink-500"
      />
      <label
        htmlFor="event-date"
        className={`absolute left-2 start-1 top-2 z-10 origin-[0] -translate-y-5 scale-75 bg-white px-2 peer-focus:text-pink-400 peer-focus:dark:text-pink-500`}
      >
        Date
      </label>
    </div>
  )
}
