import { Decor } from '~/templates/voyage/components/decor'
import { bodyFont, Eyebrow, GoldRule, headingFont } from '~/templates/voyage/components/primitives'
import { Band } from '~/templates/voyage/components/sections'

// Adapted from Isabel & Andy’s neighbourhood guide, without their 2023 event logistics.
const neighbourhoods = [
  {
    name: 'Chapultepec & Polanco',
    body: 'Pair the Museo Nacional de Antropología with a walk through Bosque de Chapultepec. Add Chapultepec Castle, Museo Tamayo or Museo Soumaya if you have more time.',
  },
  {
    name: 'Centro Histórico',
    body: 'Explore Bellas Artes, Alameda Central, Palacio Postal and the Zócalo. Walk along Madero to take in the architecture.',
    food: 'El Cardenal for a traditional Mexican meal.',
  },
  {
    name: 'Paseo de la Reforma',
    body: 'Follow the boulevard towards Chapultepec, taking in the Ángel de la Independencia and Diana the Huntress fountain along the way.',
  },
  {
    name: 'Coyoacán',
    body: 'Visit Frida Kahlo’s Casa Azul, then wander Jardín Hidalgo, Jardín Centenario and the neighbourhood markets. Reserve museum tickets ahead.',
    food: 'Los Danzantes for a leisurely lunch.',
  },
  {
    name: 'Teotihuacán',
    body: 'Set aside a separate day for the archaeological site and its Pyramids of the Sun and Moon. Arrange your return transport before setting off.',
  },
  {
    name: 'San Ángel',
    body: 'Spend a Saturday around Plaza San Jacinto and the art market, with time to wander the cobbled streets.',
    food: 'Bistró 83 for breakfast or lunch.',
  },
]

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
          <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
            A few ideas from Isabel and Andy’s Mexico City guide, for exploring before or after the
            wedding.
          </p>
        </div>
        <div className='grid gap-x-14 gap-y-10 md:grid-cols-2'>
          {neighbourhoods.map(({ name, body, food }) => (
            <article key={name} className='space-y-4 border-border border-t pt-6'>
              <h3 className={`${headingFont} text-3xl italic`}>{name}</h3>
              <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>{body}</p>
              {food ? <p className={`${bodyFont} text-lg leading-8`}>{food}</p> : null}
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
