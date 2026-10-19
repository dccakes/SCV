'use client'

/**
 * VoyageFlightSearch
 *
 * A self-contained flight search bar for the two airports that actually serve
 * the wedding destination. Guests pick which one they're flying into, type
 * their home airport, and adjust the pre-filled travel dates before jumping
 * to Google Flights in a new tab.
 */

import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { buildGoogleFlightsUrl } from '~/app/utils/google-flights'
import { searchOriginAirports } from '~/templates/voyage/components/flight-airports'
import {
  bodyFont,
  Eyebrow,
  GoldRule,
  labelFont,
  primaryButtonClass,
  sectionHeadingClass,
} from '~/templates/voyage/components/primitives'

const DESTINATIONS = ['MEX', 'PBC'] as const

/** Region codes for the airport list's countries, so they can be named in the visitor's language. */
const COUNTRY_REGIONS: Record<string, string> = {
  'United Kingdom': 'GB',
  'United States': 'US',
  Mexico: 'MX',
  Australia: 'AU',
  'United Arab Emirates': 'AE',
  Spain: 'ES',
  Netherlands: 'NL',
}

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
  const t = useTranslations('voyage.flights')
  const locale = useLocale()
  const countryNames = useMemo(() => new Intl.DisplayNames([locale], { type: 'region' }), [locale])
  const countryName = (country: string) => {
    const region = COUNTRY_REGIONS[country]
    return region ? (countryNames.of(region) ?? country) : country
  }
  const [destination, setDestination] = useState<string>(DESTINATIONS[0])
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
          <Eyebrow>{t('eyebrow')}</Eyebrow>
          <h2 className={sectionHeadingClass}>{t('heading')}</h2>
          <GoldRule />
          <p className={`${bodyFont} max-w-xl text-[#6F675D] text-lg leading-8`}>{t('intro')}</p>
        </div>

        <div className='rounded-[3px] border border-[#DDD2C0] bg-white/70 p-6 sm:p-8'>
          <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-4'>
            <label className='flex flex-col gap-2'>
              <span className={fieldLabelClass}>{t('flyingInto')}</span>
              <select
                className={fieldClass}
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
              >
                {DESTINATIONS.map((code) => (
                  <option key={code} value={code}>
                    {t(`destinations.${code}`)}
                  </option>
                ))}
              </select>
            </label>

            <label className='relative flex flex-col gap-2'>
              <span className={fieldLabelClass}>{t('flyingFrom')}</span>
              <input
                className={fieldClass}
                type='text'
                placeholder={t('placeholder')}
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
                            {airport.city}, {countryName(airport.country)}
                          </span>
                        </span>
                        <span className={`${labelFont} text-primary text-xs tracking-[0.1em]`}>
                          {airport.code}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </label>

            <label className='flex flex-col gap-2'>
              <span className={fieldLabelClass}>{t('depart')}</span>
              <input
                className={fieldClass}
                type='date'
                value={departDate}
                onChange={(event) => setDepartDate(event.target.value)}
              />
            </label>

            <label className='flex flex-col gap-2'>
              <span className={fieldLabelClass}>{t('return')}</span>
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
              className={`${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {t('search')}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
