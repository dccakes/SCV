/**
 * Voyage Mexico guide
 *
 * Two hand-written guest-guide bands for the Puebla wedding: what to see around
 * the Zócalo — where the guests are staying — and where to go in the rest of the
 * country if they want to make a trip of the flight down.
 *
 * The copy is deliberately hard-coded. It is the same for every guest, it is not
 * editable from the website manager, and Voyage currently serves a single
 * wedding. If a second Puebla-less wedding ever picks this template, lift
 * `ZOCALO_SIGHTS` / `MEXICO_TRIPS` into a website section type and feed them
 * through `WebsiteSection` like the other content blocks.
 */

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
  IconGlass,
  IconPalette,
  IconPyramid,
  IconVenue,
  IconWave,
  labelFont,
  scriptFont,
} from '~/templates/voyage/components/primitives'
import { Band, CenteredHead } from '~/templates/voyage/components/sections'

type IconComponent = (props: SVGProps<SVGSVGElement>) => React.JSX.Element

type Sight = {
  name: string
  /** How far it is from the square, in blocks and minutes on foot. */
  walk: string
  blurb: string
  Icon: IconComponent
}

type Note = {
  title: string
  body: string
}

type Trip = {
  name: string
  /** Where it is and how far, shown under the name. */
  region: string
  blurb: string
  /** How to actually get there from Puebla or Mexico City. */
  gettingThere: string
  highlights: readonly string[]
  Icon: IconComponent
}

/** Everything worth seeing within a short walk of Puebla's main square. */
const ZOCALO_SIGHTS: readonly Sight[] = [
  {
    name: 'Catedral de Puebla',
    walk: 'On the square · 1 min walk',
    blurb:
      'The twin bell towers are the tallest in Mexico. Step inside for the marble and gilt altar, then climb the north tower at the weekend for a view over the tiled domes to the volcanoes.',
    Icon: IconVenue,
  },
  {
    name: 'Capilla del Rosario',
    walk: '4 blocks · 6 min walk',
    blurb:
      'Tucked inside the Templo de Santo Domingo, this gold-leaf baroque chapel was called the eighth wonder of the New World when it opened in 1690. Free to enter, and unforgettable.',
    Icon: IconArch,
  },
  {
    name: 'Biblioteca Palafoxiana',
    walk: '1 block · 2 min walk',
    blurb:
      'The first public library in the Americas — 45,000 volumes on carved cedar shelves, much as they were left in 1646. Small entrance fee, closed Mondays.',
    Icon: IconBook,
  },
  {
    name: 'Callejón de los Sapos',
    walk: '5 blocks · 8 min walk',
    blurb:
      'Antique shops by day, a flea market on Saturday and Sunday, cantinas with live music after dark. Order a pasita at La Pasita: one shot, one cube of cheese, one raisin.',
    Icon: IconGlass,
  },
  {
    name: 'Barrio del Artista & El Parián',
    walk: '3 blocks · 5 min walk',
    blurb:
      'Painters work in open studios around a small plaza, and the El Parián market next door is the place for Talavera pottery, onyx and something to take home.',
    Icon: IconPalette,
  },
  {
    name: 'Museo Amparo',
    walk: '3 blocks · 5 min walk',
    blurb:
      'Pre-Hispanic and colonial collections in a beautifully restored mansion — and a rooftop terrace café with the best view of the cathedral in the city.',
    Icon: IconCamera,
  },
]

/** Where to eat and drink in the Centro, in the order we would do it. */
const ZOCALO_TABLE: readonly Note[] = [
  {
    title: 'Mole poblano',
    body: 'Puebla invented it. Fonda de Santa Clara and the restaurants along the square all do a classic version — have it with turkey if you can.',
  },
  {
    title: 'Chiles en nogada',
    body: 'The stuffed poblano under walnut cream is in season roughly July through September. If you see it on a menu while you are here, order it.',
  },
  {
    title: 'Cemitas & tacos árabes',
    body: 'The city’s two great street sandwiches. Cemitas are best from the Mercado de Sabores; tacos árabes come off a vertical spit and are worth a late night.',
  },
  {
    title: 'Calle de los Dulces',
    body: '6 Oriente is lined with sweet shops — camotes, borrachitos and tortitas de Santa Clara, made the same way for two centuries.',
  },
  {
    title: 'Sunset from a rooftop',
    body: 'The terraces on the square look straight at the cathedral, with Popocatépetl behind it on a clear evening. Mezcal, and stay for the light.',
  },
]

/** Half-day trips that do not need a hotel change. */
const ZOCALO_NEARBY: readonly Note[] = [
  {
    title: 'Cholula — 20 minutes',
    body: 'The Great Pyramid is the largest by volume in the world, with a yellow church sitting on top of it. Walk the tunnels, then have lunch on a terrace facing the volcano.',
  },
  {
    title: 'Tonantzintla & Acatepec — 30 minutes',
    body: 'Two village churches beside Cholula: one tiled in Talavera outside, the other with a folk-baroque interior that has to be seen to be believed.',
  },
  {
    title: 'Atlixco — 45 minutes',
    body: 'A flower-growing town with a painted village square and a viewpoint over the valley. Best on a Sunday, when the market is on.',
  },
  {
    title: 'Africam Safari — 30 minutes',
    body: 'A drive-through safari park south of the city — an easy win if you are travelling with children.',
  },
]

/** The four places we would send anyone extending the trip. */
const MEXICO_TRIPS: readonly Trip[] = [
  {
    name: 'Mexico City',
    region: 'The capital · 2 hours from Puebla',
    blurb:
      'If you add only one stop, make it this one: a great museum city wrapped around a colonial centre, with some of the best eating anywhere in the world.',
    gettingThere:
      'ADO buses leave Puebla’s CAPU terminal for Mexico City every twenty minutes and take about two hours; driving is just as easy.',
    highlights: [
      'Museo Nacional de Antropología — the finest museum in the country. Give it half a day.',
      'The Centro Histórico: the Zócalo, Templo Mayor and the Diego Rivera murals inside the Palacio Nacional.',
      'Frida Kahlo’s Casa Azul in Coyoacán — tickets sell out, so book online before you fly.',
      'Roma and Condesa for long lunches, tree-lined streets and cocktails afterwards.',
      'Teotihuacán, an hour north — arrive at opening, or float over the pyramids in a balloon.',
      'A Sunday on the Xochimilco canals, or lucha libre at Arena México on a Friday night.',
    ],
    Icon: IconPyramid,
  },
  {
    name: 'Oaxaca City',
    region: 'Oaxaca · 4½ hours by road, 1 hour by air',
    blurb:
      'The country’s food and craft capital — mezcal, seven moles and markets that are worth the journey on their own. Two nights minimum, three if you can.',
    gettingThere:
      'Fly from Mexico City in an hour, or take the toll road down through the mountains from Puebla.',
    highlights: [
      'Mercado 20 de Noviembre for the smoke-filled grill hall, with Mercado Benito Juárez next door.',
      'Santo Domingo and its cultural museum — the ethnobotanical garden tour is excellent.',
      'Monte Albán, the Zapotec city on the ridge, thirty minutes above town.',
      'Mezcal palenques and the rug weavers of Teotitlán del Valle out in the valleys.',
      'Hierve el Agua’s petrified waterfalls, best as an early start.',
    ],
    Icon: IconAgave,
  },
  {
    name: 'Puerto Escondido',
    region: 'Oaxacan coast · 1 hour by air',
    blurb:
      'Where Mexico City goes to swim: barefoot, unpolished and warm all year. The easiest possible way to end a trip.',
    gettingThere:
      'Short flights from Mexico City and Oaxaca City. The coast road is beautiful but long — fly if you are short on days.',
    highlights: [
      'Playa Carrizalillo for the calm swimming cove; Zicatela for the surf and the sunset.',
      'Bioluminescence on the Manialtepec lagoon, on a moonless night.',
      'A dawn boat trip for dolphins and turtles — and whales in winter.',
      'Baby-turtle releases at Playa Bacocho most evenings in season.',
      'Mazunte and Zipolite, an hour east, if you want somewhere quieter still.',
    ],
    Icon: IconWave,
  },
  {
    name: 'San Miguel de Allende',
    region: 'Guanajuato · 3½ hours from Mexico City',
    blurb:
      'Cobblestones, rooftop bars and a pink church out of a fairy tale. The prettiest small town in Mexico and made for a slow two nights.',
    gettingThere:
      'Fly into Querétaro (QRO) or León (BJX) and drive ninety minutes; comfortable buses also run from Mexico City.',
    highlights: [
      'The Parroquia de San Miguel Arcángel on the Jardín — best at golden hour from a rooftop.',
      'Fábrica La Aurora, an old textile mill full of galleries and studios.',
      'Hot springs at La Gruta or Escondido Place, twenty minutes out of town.',
      'A cooking class, or a market morning at the Tuesday tianguis.',
      'Guanajuato city, an hour away, for tunnels, callejones and colour.',
    ],
    Icon: IconChurch,
  },
]

const sightNameClass = `${headingFont} text-[#1D2320] text-xl italic`
const distanceClass = `${labelFont} text-[#B15C41] text-[0.56rem] uppercase tracking-[0.2em]`
const cardBodyClass = `${bodyFont} text-[#6F675D] text-sm leading-6`

/** A titled list of short notes — used for the table and the day trips. */
function NoteList({ eyebrow, notes }: { eyebrow: string; notes: readonly Note[] }) {
  return (
    <div className='flex flex-col gap-5'>
      <Eyebrow>{eyebrow}</Eyebrow>
      <GoldRule className='self-start' />
      <ul className='flex flex-col gap-4'>
        {notes.map((note) => (
          <li key={note.title} className='flex flex-col gap-1'>
            <p
              className={`${labelFont} font-semibold text-[#1D2320] text-[0.62rem] uppercase tracking-[0.2em]`}
            >
              {note.title}
            </p>
            <p className={cardBodyClass}>{note.body}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * "Around the Zócalo" — the walkable Centro Histórico guide for guests staying
 * on or beside Puebla's main square, plus where to eat and the short drives
 * that fit into a free afternoon.
 */
export function VoyageZocalo() {
  return (
    <Band id='zocalo' className='relative overflow-hidden'>
      <Decor
        name='floralSpray2'
        className='pointer-events-none absolute top-1/2 -left-12 hidden h-[24rem] w-auto -translate-y-1/2 -scale-x-100 lg:block'
        fallback={
          <FloralCorner className='pointer-events-none absolute top-8 left-3 hidden h-24 w-auto -scale-x-100 opacity-70 lg:block' />
        }
      />
      <div className='relative flex flex-col items-center gap-12'>
        <CenteredHead eyebrow='Your Neighbourhood' heading='Around the Zócalo' />
        <p
          className={`${bodyFont} max-w-3xl text-balance text-center text-[#6F675D] text-[1.06rem] leading-8`}
        >
          Everyone is staying within a few blocks of the Zócalo, Puebla&rsquo;s main square, which
          puts the whole of the Centro Histórico — a UNESCO World Heritage site — within a short
          walk of your door. Here is what we would do with a free morning or an afternoon between
          events.
        </p>

        <ul className='grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {ZOCALO_SIGHTS.map(({ name, walk, blurb, Icon }) => (
            <li
              key={name}
              className='flex flex-col gap-3 rounded-[3px] border border-[#DDD2C0] bg-[#FBF8F2] px-6 py-6'
            >
              <div className='flex items-start justify-between gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <h3 className={sightNameClass}>{name}</h3>
                  <span className={distanceClass}>{walk}</span>
                </div>
                <Icon className='h-8 w-8 shrink-0 text-[#8A7A66]' />
              </div>
              <p className={cardBodyClass}>{blurb}</p>
            </li>
          ))}
        </ul>

        <div className='grid w-full gap-12 lg:grid-cols-2 lg:gap-16'>
          <NoteList eyebrow='Eat & Drink' notes={ZOCALO_TABLE} />
          <NoteList eyebrow='Worth the Short Drive' notes={ZOCALO_NEARBY} />
        </div>
      </div>
    </Band>
  )
}

/**
 * "Where to Go in Mexico" — four destinations worth building a longer trip
 * around, each with how to get there and what not to miss.
 */
export function VoyageExploreMexico() {
  return (
    <Band id='explore-mexico' tone='cream' className='relative overflow-hidden'>
      <Decor
        name='floralBranch'
        className='pointer-events-none absolute top-10 -right-10 hidden h-[24rem] w-auto lg:block xl:right-0'
        fallback={
          <FloralCorner className='pointer-events-none absolute top-6 right-3 hidden h-24 w-auto opacity-70 lg:block' />
        }
      />
      <div className='relative flex flex-col items-center gap-12'>
        <CenteredHead eyebrow='Make a Trip of It' heading='Where to Go in Mexico' />
        <p
          className={`${bodyFont} max-w-3xl text-balance text-center text-[#6F675D] text-[1.06rem] leading-8`}
        >
          You are flying a long way for one weekend — so stay a little longer. These are the four
          places we would send you, whether you have two extra days or two extra weeks.
        </p>

        <div className='grid w-full gap-5 lg:grid-cols-2'>
          {MEXICO_TRIPS.map(({ name, region, blurb, gettingThere, highlights, Icon }) => (
            <article
              key={name}
              className='flex flex-col gap-4 rounded-[3px] border border-[#DDD2C0] bg-[#F7F3EC] px-7 py-8'
            >
              <div className='flex items-start justify-between gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <h3 className={`${headingFont} text-2xl text-[#1D2320] italic`}>{name}</h3>
                  <span className={distanceClass}>{region}</span>
                </div>
                <Icon className='h-9 w-9 shrink-0 text-[#8A7A66]' />
              </div>
              <GoldRule className='self-start' />
              <p className={`${bodyFont} text-[#6F675D] text-[0.98rem] leading-7`}>{blurb}</p>

              <ul className='flex flex-col gap-2.5'>
                {highlights.map((highlight) => (
                  <li key={highlight} className='flex items-start gap-3'>
                    <span
                      aria-hidden='true'
                      className='mt-[0.6rem] h-1 w-1 shrink-0 rounded-full bg-[#B15C41]'
                    />
                    <span className={cardBodyClass}>{highlight}</span>
                  </li>
                ))}
              </ul>

              <p
                className={`${bodyFont} mt-auto border-[#DDD2C0] border-t pt-4 text-[#6F675D] text-sm leading-6`}
              >
                <span
                  className={`${labelFont} font-semibold text-[#1D2320] text-[0.6rem] uppercase tracking-[0.2em]`}
                >
                  Getting there ·{' '}
                </span>
                {gettingThere}
              </p>
            </article>
          ))}
        </div>

        <p className={`${scriptFont} text-center text-3xl text-[#B15C41]`}>
          Come for the wedding, stay for the country.
        </p>
      </div>
    </Band>
  )
}
