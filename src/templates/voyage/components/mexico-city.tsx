import { useTranslations } from 'next-intl'
import { Decor } from '~/templates/voyage/components/decor'
import {
  bodyFont,
  Eyebrow,
  GoldRule,
  headingFont,
  labelFont,
} from '~/templates/voyage/components/primitives'
import { Band } from '~/templates/voyage/components/sections'

/** Each id names a `voyage.mexicoCity.neighbourhoods` entry; places name `voyage.mexicoCity.places`. */
type Neighbourhood = {
  id: string
  culture: readonly string[]
  food: readonly string[]
}

const neighbourhoods: readonly Neighbourhood[] = [
  {
    id: 'chapultepec',
    culture: ['antropologia', 'bosque', 'castillo', 'tamayo', 'soumaya'],
    food: ['pujol', 'contramar'],
  },
  {
    id: 'centro',
    culture: ['bellasArtes', 'alameda', 'palacioPostal', 'zocalo', 'madero'],
    food: ['cardenal', 'tacuba'],
  },
  {
    id: 'reforma',
    culture: ['angel', 'diana', 'reforma'],
    food: ['nin', 'torreLatino'],
  },
  {
    id: 'coyoacan',
    culture: ['casaAzul', 'hidalgo', 'centenario', 'coyoacanMarkets'],
    food: ['danzantes', 'mercadoCoyoacan'],
  },
  {
    id: 'teotihuacan',
    culture: ['sol', 'luna', 'calzada'],
    food: ['gruta'],
  },
  {
    id: 'sanAngel',
    culture: ['sanJacinto', 'bazar', 'cobbles'],
    food: ['bistro83', 'sanAngelInn'],
  },
]

function RecommendationDisclosure({ label, places }: { label: string; places: readonly string[] }) {
  const t = useTranslations('voyage.mexicoCity')
  if (places.length === 0) return null

  return (
    <details className='group border-[#DDD2C0] border-t pt-3'>
      <summary
        className={`${labelFont} flex cursor-pointer list-none items-center justify-between text-primary text-xs uppercase tracking-[0.2em] [&::-webkit-details-marker]:hidden`}
      >
        <span>{label}</span>
        <span aria-hidden='true' className='text-lg leading-none'>
          <span className='group-open:hidden'>+</span>
          <span className='hidden group-open:inline'>×</span>
        </span>
      </summary>
      <ul className={`${bodyFont} mt-3 space-y-2 text-base leading-7`}>
        {places.map((place) => (
          <li key={place} className='pl-1'>
            <span className='mr-2 text-primary'>•</span>
            <span>
              {t('recommendation', {
                name: t(`places.${place}.name`),
                description: t(`places.${place}.description`),
              })}
            </span>
          </li>
        ))}
      </ul>
    </details>
  )
}

export function VoyageMexicoCity() {
  const t = useTranslations('voyage.mexicoCity')
  return (
    <Band id='mexico-city' className='relative overflow-hidden'>
      <Decor
        name='floralBranch'
        className='pointer-events-none absolute -right-12 bottom-8 hidden h-72 w-auto opacity-60 2xl:block'
      />
      <div className='relative space-y-12'>
        <div className='mx-auto flex max-w-3xl flex-col items-center gap-5 text-center'>
          <Eyebrow>{t('eyebrow')}</Eyebrow>
          <h2 className={`${headingFont} font-light text-4xl italic sm:text-5xl`}>
            {t('heading')}
          </h2>
          <GoldRule />
        </div>
        <div className='grid gap-x-14 gap-y-10 md:grid-cols-2'>
          {neighbourhoods.map(({ id, culture, food }) => (
            <article
              key={id}
              className='flex flex-col gap-5 rounded-[3px] border border-[#DDD2C0] bg-[#FBF8F2] p-6 sm:p-8'
            >
              <h3 className={`${headingFont} text-3xl italic`}>{t(`neighbourhoods.${id}`)}</h3>
              <div className='space-y-4'>
                <RecommendationDisclosure label={t('culture')} places={culture} />
                <RecommendationDisclosure label={t('food')} places={food} />
              </div>
            </article>
          ))}
        </div>
        <div className='grid gap-8 border-border border-t pt-8 md:grid-cols-2'>
          <div className='space-y-3'>
            <h3 className={`${headingFont} text-2xl`}>{t('gettingAroundHeading')}</h3>
            <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
              {t('gettingAroundBody')}
            </p>
          </div>
          <div className='space-y-3'>
            <h3 className={`${headingFont} text-2xl`}>{t('beforeHeading')}</h3>
            <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
              {t('beforeBody')}
            </p>
          </div>
        </div>
      </div>
    </Band>
  )
}
