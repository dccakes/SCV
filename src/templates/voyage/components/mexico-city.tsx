import { Decor } from '~/templates/voyage/components/decor'
import {
  bodyFont,
  Eyebrow,
  GoldRule,
  headingFont,
  labelFont,
} from '~/templates/voyage/components/primitives'
import { Band } from '~/templates/voyage/components/sections'

type Recommendation = { name: string; description: string }

type Neighbourhood = {
  name: string
  culture: Recommendation[]
  food: Recommendation[]
}

const neighbourhoods: Neighbourhood[] = [
  {
    name: 'Chapultepec & Polanco',
    culture: [
      { name: 'Museo Nacional de Antropología', description: 'The finest museum in the country' },
      { name: 'Bosque de Chapultepec', description: 'A leafy park for a long walk' },
      { name: 'Chapultepec Castle', description: 'Hilltop history and city views' },
      { name: 'Museo Tamayo', description: 'Contemporary art museum' },
      { name: 'Museo Soumaya', description: 'Free art collection in a striking building' },
    ],
    food: [
      { name: 'Pujol', description: 'Modern Mexican tasting menus in Polanco' },
      { name: 'Contramar', description: 'Seafood lunch worth booking ahead' },
    ],
  },
  {
    name: 'Centro Histórico',
    culture: [
      { name: 'Bellas Artes', description: 'Palace of murals, music and exhibitions' },
      { name: 'Alameda Central', description: 'Mexico City’s oldest public park' },
      { name: 'Palacio Postal', description: 'Ornate early twentieth-century post office' },
      { name: 'Zócalo', description: 'The city’s vast central square' },
      { name: 'Madero', description: 'Pedestrian street lined with architecture' },
    ],
    food: [
      { name: 'El Cardenal', description: 'Traditional Mexican restaurant' },
      { name: 'Café de Tacuba', description: 'Historic café for breakfast and lunch' },
    ],
  },
  {
    name: 'Paseo de la Reforma',
    culture: [
      { name: 'Ángel de la Independencia', description: 'The city’s iconic golden monument' },
      { name: 'Diana the Huntress Fountain', description: 'A landmark bronze fountain' },
      { name: 'Paseo de la Reforma', description: 'Grand boulevard for a city stroll' },
    ],
    food: [
      { name: 'Café Nin', description: 'Pastries and an easy breakfast stop' },
      { name: 'Torre Latinoamericana', description: 'Cocktails with a skyline view' },
    ],
  },
  {
    name: 'Coyoacán',
    culture: [
      { name: 'Casa Azul', description: 'Frida Kahlo’s former home and museum' },
      { name: 'Jardín Hidalgo', description: 'The neighbourhood’s lively main square' },
      { name: 'Jardín Centenario', description: 'A shady garden with the coyote fountain' },
      { name: 'Coyoacán markets', description: 'Local crafts, colour and street life' },
    ],
    food: [
      { name: 'Los Danzantes', description: 'Leisurely lunch with regional Mexican cooking' },
      { name: 'Mercado de Coyoacán', description: 'Classic tostadas and market snacks' },
    ],
  },
  {
    name: 'Teotihuacán',
    culture: [
      { name: 'Pyramid of the Sun', description: 'The site’s monumental central pyramid' },
      { name: 'Pyramid of the Moon', description: 'A ceremonial pyramid with a long view' },
      { name: 'Avenue of the Dead', description: 'The ancient city’s central processional road' },
    ],
    food: [{ name: 'La Gruta', description: 'Cave restaurant near the archaeological site' }],
  },
  {
    name: 'San Ángel',
    culture: [
      { name: 'Plaza San Jacinto', description: 'The heart of the Saturday art market' },
      { name: 'Bazar del Sábado', description: 'Handcrafts and artwork each Saturday' },
      { name: 'Cobbled streets', description: 'A slower neighbourhood for wandering' },
    ],
    food: [
      { name: 'Bistró 83', description: 'Breakfast or lunch in a leafy courtyard' },
      { name: 'San Ángel Inn', description: 'Classic hacienda setting for a long meal' },
    ],
  },
]

function RecommendationDisclosure({
  label,
  recommendations,
}: {
  label: 'Culture' | 'Food'
  recommendations: Recommendation[]
}) {
  if (recommendations.length === 0) return null

  return (
    <details className='group border-[#DDD2C0] border-t pt-3'>
      <summary
        className={`${labelFont} flex cursor-pointer list-none items-center justify-between text-[#B15C41] text-xs uppercase tracking-[0.2em] [&::-webkit-details-marker]:hidden`}
      >
        <span>{label}</span>
        <span aria-hidden='true' className='text-lg leading-none'>
          <span className='group-open:hidden'>+</span>
          <span className='hidden group-open:inline'>×</span>
        </span>
      </summary>
      <ul className={`${bodyFont} mt-3 space-y-2 text-base leading-7`}>
        {recommendations.map(({ name, description }) => (
          <li key={name} className='pl-1'>
            <span className='mr-2 text-[#B15C41]'>•</span>
            <span>
              {name} — {description}
            </span>
          </li>
        ))}
      </ul>
    </details>
  )
}

export function VoyageMexicoCity() {
  return (
    <Band id='mexico-city' className='relative overflow-hidden'>
      <Decor
        name='floralBranch'
        className='pointer-events-none absolute -right-12 bottom-8 hidden h-72 w-auto opacity-60 2xl:block'
      />
      <div className='relative space-y-12'>
        <div className='mx-auto flex max-w-3xl flex-col items-center gap-5 text-center'>
          <Eyebrow>A few days in the capital</Eyebrow>
          <h2 className={`${headingFont} font-light text-4xl italic sm:text-5xl`}>
            Mexico City, neighbourhood by neighbourhood
          </h2>
          <GoldRule />
        </div>
        <div className='grid gap-x-14 gap-y-10 md:grid-cols-2'>
          {neighbourhoods.map(({ name, culture, food }) => (
            <article
              key={name}
              className='flex flex-col gap-5 rounded-[3px] border border-[#DDD2C0] bg-[#FBF8F2] p-6 sm:p-8'
            >
              <h3 className={`${headingFont} text-3xl italic`}>{name}</h3>
              <div className='space-y-4'>
                <RecommendationDisclosure label='Culture' recommendations={culture} />
                <RecommendationDisclosure label='Food' recommendations={food} />
              </div>
            </article>
          ))}
        </div>
        <div className='grid gap-8 border-border border-t pt-8 md:grid-cols-2'>
          <div className='space-y-3'>
            <h3 className={`${headingFont} text-2xl`}>Getting around</h3>
            <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
              Walk within each neighbourhood; use Uber or a hotel-arranged taxi between areas.
              ECOBICI and Turibus are other ways to explore. Allow extra time for city traffic.
            </p>
          </div>
          <div className='space-y-3'>
            <h3 className={`${headingFont} text-2xl`}>Before you go</h3>
            <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
              Check current opening days and reservations before setting out, particularly for
              museums and restaurants. Keep WhatsApp handy for coordinating with your hotel or
              driver.
            </p>
          </div>
        </div>
      </div>
    </Band>
  )
}
