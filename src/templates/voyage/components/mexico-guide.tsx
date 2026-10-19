/**
 * Voyage Mexico guide
 *
 * Two hand-written guest-guide bands for the Puebla wedding: what to see around
 * the Zócalo — where the guests are staying — and where to go in the rest of the
 * country if they want to make a trip of the flight down.
 *
 * The copy is written for a wedding at the end of May, so the seasonal notes
 * (the volcano view, chiles en nogada, what to pack, the coast) describe late
 * May and June. Re-check them if the template is ever reused for another date.
 *
 * The copy is deliberately hard-coded, in English and Spanish, in the
 * `voyage.mexicoGuide` messages. It is the same for every guest, it is not
 * editable from the website manager, and Voyage currently serves a single
 * wedding. If a second Puebla-less wedding ever picks this template, lift
 * `ZOCALO_SIGHTS` / `MEXICO_TRIPS` into a website section type and feed them
 * through `WebsiteSection` like the other content blocks.
 *
 * Distances are measured on foot from the Zócalo. Opening days, the cathedral
 * bell-tower visit and the Hierve el Agua access road all change from time to
 * time, so the copy hedges rather than promising — check before a wedding
 * weekend if you want to tighten it.
 */

import { useTranslations } from 'next-intl'
import type { SVGProps } from 'react'
import { Decor } from '~/templates/voyage/components/decor'
import {
  bodyFont,
  Eyebrow,
  FloralCorner,
  GoldRule,
  headingFont,
  IconAgave,
  IconArch,
  IconBook,
  IconCamera,
  IconChurch,
  IconCuisine,
  IconFort,
  IconGlass,
  IconPalette,
  IconPyramid,
  IconRosette,
  IconVenue,
  IconWave,
  labelFont,
  scriptFont,
} from '~/templates/voyage/components/primitives'
import { Band, CenteredHead } from '~/templates/voyage/components/sections'

type IconComponent = (props: SVGProps<SVGSVGElement>) => React.JSX.Element

/**
 * The copy lives in the `voyage.mexicoGuide` messages; each entry here names its
 * message id and carries only what is not copy (icons, ordering).
 */
type Sight = { id: string; Icon: IconComponent }
type Trip = { id: string; Icon: IconComponent }

/** Everything worth seeing within a short walk of Puebla's main square. */
const ZOCALO_SIGHTS: readonly Sight[] = [
  { id: 'catedral', Icon: IconVenue },
  { id: 'rosario', Icon: IconArch },
  { id: 'palafoxiana', Icon: IconBook },
  { id: 'munecos', Icon: IconRosette },
  { id: 'santaRosa', Icon: IconCuisine },
  { id: 'sapos', Icon: IconGlass },
  { id: 'artista', Icon: IconPalette },
  { id: 'amparo', Icon: IconCamera },
  { id: 'fuertes', Icon: IconFort },
]

/** Where to eat and drink in the Centro (`table.*`). */
const ZOCALO_TABLE = ['mole', 'chiles', 'cemitas', 'dulces', 'rooftop'] as const

/** Half-day trips that do not need a hotel change (`nearby.*`). */
const ZOCALO_NEARBY = ['cholula', 'tonantzintla', 'atlixco'] as const

/** The practical things nobody tells you until you are already here (`practical.*`). */
const ZOCALO_PRACTICAL = ['mondays', 'altitude', 'cash', 'gettingAround', 'pack'] as const

/** The four places we would send anyone extending the trip. */
const MEXICO_TRIPS: readonly Trip[] = [
  { id: 'mexicoCity', Icon: IconPyramid },
  { id: 'oaxaca', Icon: IconAgave },
  { id: 'puertoEscondido', Icon: IconWave },
  { id: 'sanMiguel', Icon: IconChurch },
]

/** Every trip lists six highlights, keyed `h1`…`h6`. */
const TRIP_HIGHLIGHTS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const

const distanceClass = `${labelFont} text-primary text-[0.56rem] uppercase tracking-[0.2em]`
const cardBodyClass = `${bodyFont} text-[#6F675D] text-sm leading-6`
const noteTitleClass = `${labelFont} font-semibold text-[#1D2320] text-[0.62rem] uppercase tracking-[0.2em]`

/** A titled list of short notes — used for the table and the day trips. */
function NoteList({
  eyebrow,
  group,
  notes,
}: {
  eyebrow: string
  group: 'table' | 'nearby'
  notes: readonly string[]
}) {
  const t = useTranslations('voyage.mexicoGuide')
  return (
    <div className='flex flex-col gap-5'>
      <Eyebrow>{eyebrow}</Eyebrow>
      <GoldRule className='self-start' />
      <ul className='flex flex-col gap-4'>
        {notes.map((note) => (
          <li key={note} className='flex flex-col gap-1'>
            <p className={noteTitleClass}>{t(`${group}.${note}.title`)}</p>
            <p className={cardBodyClass}>{t(`${group}.${note}.body`)}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * "Welcome to Puebla" — the walkable Centro Histórico guide for guests staying
 * on or beside the Zócalo, plus where to eat, the short drives that fit into a
 * free afternoon, and the practical things worth knowing on arrival. Keeps the
 * `#zocalo` anchor so existing links stay valid.
 */
export function VoyageZocalo() {
  const t = useTranslations('voyage.mexicoGuide')
  return (
    <Band id='zocalo' className='relative overflow-hidden'>
      {/*
        Side artwork only appears from 2xl up. It is positioned against the
        section, so anything narrower than that puts it on top of the centred
        max-w-6xl copy column instead of in the margin beside it.
      */}
      <Decor
        name='floralSpray2'
        className='pointer-events-none absolute top-1/2 -left-12 z-0 hidden h-[24rem] w-auto -translate-y-1/2 -scale-x-100 2xl:block'
        fallback={
          <FloralCorner className='pointer-events-none absolute top-8 left-3 z-0 hidden h-24 w-auto -scale-x-100 opacity-70 2xl:block' />
        }
      />
      <div className='relative z-10 flex flex-col items-center gap-12'>
        <CenteredHead eyebrow={t('zocalo.eyebrow')} heading={t('zocalo.heading')} />
        <p
          className={`${bodyFont} max-w-3xl text-balance text-center text-[#6F675D] text-[1.06rem] leading-8`}
        >
          {t('zocalo.intro')}
        </p>

        <ul className='grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {ZOCALO_SIGHTS.map(({ id, Icon }) => (
            <li
              key={id}
              className='flex flex-col gap-3 rounded-[3px] border border-[#DDD2C0] bg-[#FBF8F2] px-6 py-6'
            >
              <div className='flex items-start justify-between gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <h3 className={`${headingFont} text-[#1D2320] text-xl italic`}>
                    {t(`sights.${id}.name`)}
                  </h3>
                  <span className={distanceClass}>{t(`sights.${id}.distance`)}</span>
                </div>
                <Icon className='h-8 w-8 shrink-0 text-[#8A7A66]' />
              </div>
              <p className={cardBodyClass}>{t(`sights.${id}.blurb`)}</p>
            </li>
          ))}
        </ul>

        <div className='grid w-full gap-12 lg:grid-cols-2 lg:gap-16'>
          <NoteList eyebrow={t('zocalo.eatDrink')} group='table' notes={ZOCALO_TABLE} />
          <NoteList eyebrow={t('zocalo.shortDrive')} group='nearby' notes={ZOCALO_NEARBY} />
        </div>

        <VoyagePracticalInfo localOnly />
      </div>
    </Band>
  )
}

/**
 * "Where to Go in Mexico" — four destinations worth building a longer trip
 * around, each with how to get there and what not to miss.
 */
export function VoyageExploreMexico() {
  const t = useTranslations('voyage.mexicoGuide')
  return (
    <Band id='explore-mexico' tone='cream' className='relative overflow-hidden'>
      {/* Same margin-only rule as the Puebla band above. */}
      <Decor
        name='floralBranch'
        className='pointer-events-none absolute top-10 -right-12 z-0 hidden h-[24rem] w-auto 2xl:block'
        fallback={
          <FloralCorner className='pointer-events-none absolute top-6 right-3 z-0 hidden h-24 w-auto opacity-70 2xl:block' />
        }
      />
      <div className='relative z-10 flex flex-col items-center gap-12'>
        <CenteredHead eyebrow={t('explore.eyebrow')} heading={t('explore.heading')} />
        <p
          className={`${bodyFont} max-w-3xl text-balance text-center text-[#6F675D] text-[1.06rem] leading-8`}
        >
          {t('explore.intro')}
        </p>

        <div className='grid w-full gap-5 lg:grid-cols-2'>
          {MEXICO_TRIPS.map(({ id, Icon }) => (
            <article
              key={id}
              className='flex flex-col gap-4 rounded-[3px] border border-[#DDD2C0] bg-[#F7F3EC] px-7 py-8'
            >
              <div className='flex items-start justify-between gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <h3 className={`${headingFont} text-2xl text-[#1D2320] italic`}>
                    {t(`trips.${id}.name`)}
                  </h3>
                  <span className={distanceClass}>{t(`trips.${id}.region`)}</span>
                </div>
                <Icon className='h-9 w-9 shrink-0 text-[#8A7A66]' />
              </div>
              <GoldRule className='self-start' />
              <p className={`${bodyFont} text-[#6F675D] text-[0.98rem] leading-7`}>
                {t(`trips.${id}.blurb`)}
              </p>

              <ul className='flex flex-col gap-2.5'>
                {TRIP_HIGHLIGHTS.map((highlight) => (
                  <li key={highlight} className='flex items-start gap-3'>
                    <span
                      aria-hidden='true'
                      className='mt-[0.6rem] h-1 w-1 shrink-0 rounded-full bg-primary'
                    />
                    <span className={cardBodyClass}>
                      {t(`trips.${id}.highlights.${highlight}`)}
                    </span>
                  </li>
                ))}
              </ul>

              <p
                className={`${bodyFont} mt-auto border-[#DDD2C0] border-t pt-4 text-[#6F675D] text-sm leading-6`}
              >
                <span className={noteTitleClass}>{t('explore.gettingThere')}</span>
                {t(`trips.${id}.gettingThere`)}
              </p>
            </article>
          ))}
        </div>

        <p
          className={`${bodyFont} max-w-3xl text-balance text-center text-[#6F675D] text-[0.98rem] leading-7`}
        >
          {t('explore.outro')}
        </p>

        <p className={`${scriptFont} text-center text-3xl text-primary`}>{t('explore.tagline')}</p>
      </div>
    </Band>
  )
}

/** Practical travel notes live on Travel, museum notes stay in the city guide. */
export function VoyagePracticalInfo({ localOnly = false }: { localOnly?: boolean }) {
  const t = useTranslations('voyage.mexicoGuide')
  return (
    <div className='flex w-full flex-col gap-6 rounded-[3px] border border-[#DDD2C0] bg-[#FBF8F2] px-7 py-8 sm:px-9'>
      <div className='flex flex-col gap-4'>
        <Eyebrow>{t('goodToKnow')}</Eyebrow>
        <GoldRule className='self-start' />
      </div>
      <ul className='grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3'>
        {ZOCALO_PRACTICAL.filter((note) =>
          localOnly ? note === 'mondays' : note !== 'mondays'
        ).map((note) => (
          <li key={note} className='flex flex-col gap-1'>
            <p className={noteTitleClass}>{t(`practical.${note}.title`)}</p>
            <p className={cardBodyClass}>{t(`practical.${note}.body`)}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
