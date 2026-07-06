'use client'

/**
 * VoyageFlightSearch
 *
 * A self-contained flight search bar for the two airports that actually serve
 * the wedding destination. Guests pick which one they're flying into, type
 * their home airport, and adjust the pre-filled travel dates before jumping
 * to Google Flights in a new tab.
 */

import { useMemo, useState } from 'react'
import { buildGoogleFlightsUrl } from '~/app/utils/google-flights'
import { searchOriginAirports } from '~/templates/voyage/components/flight-airports'
import {
  bodyFont,
  Eyebrow,
  GoldRule,
  labelFont,
  sectionHeadingClass,
} from '~/templates/voyage/components/primitives'

const DESTINATIONS = [
  { code: 'MEX', label: 'Mexico City (MEX)' },
  { code: 'PBC', label: 'Puebla (PBC)' },
] as const

const fieldLabelClass = `${labelFont} text-[#6F675D] text-[0.62rem] uppercase tracking-[0.22em]`
const fieldClass =
  'w-full rounded-[2px] border border-[#DDD2C0] bg-white px-4 py-3 text-[#1D2320] text-sm outline-none transition-colors focus:border-[#B15C41]'

export function VoyageFlightSearch({
  departPlaceholder,
  returnPlaceholder,
}: {
  departPlaceholder: string | null
  returnPlaceholder: string | null
}) {
  const [destination, setDestination] = useState<string>(DESTINATIONS[0].code)
  const [origin, setOrigin] = useState('')
  const [isOriginFocused, setIsOriginFocused] = useState(false)
  const [departDate, setDepartDate] = useState(departPlaceholder ?? '')
  const [returnDate, setReturnDate] = useState(returnPlaceholder ?? '')

  const originSuggestions = useMemo(() => searchOriginAirports(origin), [origin])
  const showSuggestions = isOriginFocused && originSuggestions.length > 0

  const canSearch = origin.trim().length >= 3 && departDate.length > 0

  const handleSearch = () => {
    if (!canSearch) return
    const url = buildGoogleFlightsUrl({
      origin,
      destination,
      departDate,
      returnDate: returnDate || undefined,
    })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <section id='flights' className='w-full scroll-mt-24 bg-[#FBF8F2] px-6 py-20 sm:py-24 lg:px-10'>
      <div className='mx-auto max-w-4xl'>
        <div className='mb-12 flex flex-col items-center gap-4 text-center'>
          <Eyebrow>Getting There</Eyebrow>
          <h2 className={sectionHeadingClass}>Search Flights</h2>
          <GoldRule />
          <p className={`${bodyFont} max-w-xl text-[#6F675D] text-lg leading-8`}>
            We recommend flying to either Mexico City or Puebla — find a flight into whichever
            airport suits your journey.
          </p>
        </div>

        <div className='rounded-[3px] border border-[#DDD2C0] bg-white/70 p-6 sm:p-8'>
          <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-4'>
            <label className='flex flex-col gap-2'>
              <span className={fieldLabelClass}>Flying Into</span>
              <select
                className={fieldClass}
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
              >
                {DESTINATIONS.map((airport) => (
                  <option key={airport.code} value={airport.code}>
                    {airport.label}
                  </option>
                ))}
              </select>
            </label>

            <label className='relative flex flex-col gap-2'>
              <span className={fieldLabelClass}>Flying From</span>
              <input
                className={fieldClass}
                type='text'
                placeholder='City or airport code, e.g. London'
                autoComplete='off'
                value={origin}
                onChange={(event) => setOrigin(event.target.value.toUpperCase())}
                onFocus={() => setIsOriginFocused(true)}
                onBlur={() => setIsOriginFocused(false)}
              />
              {showSuggestions ? (
                <ul className='absolute top-full left-0 z-10 mt-1 w-full rounded-[2px] border border-[#DDD2C0] bg-white shadow-lg'>
                  {originSuggestions.map((airport) => (
                    <li key={airport.code}>
                      <button
                        type='button'
                        className='flex w-full items-start justify-between gap-3 px-4 py-2.5 text-left hover:bg-[#FBF8F2]'
                        onMouseDown={(event) => {
                          event.preventDefault()
                          setOrigin(airport.code)
                          setIsOriginFocused(false)
                        }}
                      >
                        <span className='flex flex-col'>
                          <span className='text-[#1D2320] text-sm'>{airport.name}</span>
                          <span className='text-[#6F675D] text-xs'>
                            {airport.city}, {airport.country}
                          </span>
                        </span>
                        <span className={`${labelFont} text-[#B15C41] text-xs tracking-[0.1em]`}>
                          {airport.code}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </label>

            <label className='flex flex-col gap-2'>
              <span className={fieldLabelClass}>Depart</span>
              <input
                className={fieldClass}
                type='date'
                value={departDate}
                onChange={(event) => setDepartDate(event.target.value)}
              />
            </label>

            <label className='flex flex-col gap-2'>
              <span className={fieldLabelClass}>Return</span>
              <input
                className={fieldClass}
                type='date'
                value={returnDate}
                onChange={(event) => setReturnDate(event.target.value)}
              />
            </label>
          </div>

          <div className='mt-7 flex justify-center'>
            <button
              type='button'
              onClick={handleSearch}
              disabled={!canSearch}
              className={`${labelFont} inline-flex items-center justify-center gap-2 rounded-[2px] bg-[#B15C41] px-8 py-3.5 text-[#F7F3EC] text-[0.68rem] uppercase tracking-[0.28em] transition-colors duration-300 hover:bg-[#92462F] disabled:cursor-not-allowed disabled:opacity-40`}
            >
              Search Flights
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
