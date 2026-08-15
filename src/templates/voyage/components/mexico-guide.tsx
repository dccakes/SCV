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
 *
 * Distances are measured on foot from the Zócalo. Opening days, the cathedral
 * bell-tower visit and the Hierve el Agua access road all change from time to
 * time, so the copy hedges rather than promising — check before a wedding
 * weekend if you want to tighten it.
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

type Sight = {
  name: string
  /** How far it is from the square, in blocks and minutes on foot. */
  distance: string
  blurb: string
  Icon: IconComponent
}

type Note = {
  title: string
  body: string
}

type Trip = {
  name: string
  /** Where it is and how far, always measured from Puebla or Mexico City by name. */
  region: string
  blurb: string
  /** How to actually get there. */
  gettingThere: string
  highlights: readonly string[]
  Icon: IconComponent
}

/** Everything worth seeing within a short walk of Puebla's main square. */
const ZOCALO_SIGHTS: readonly Sight[] = [
  {
    name: 'Catedral de Puebla',
    distance: 'On the square · 1 min walk',
    blurb:
      'The twin towers are the tallest cathedral towers in Mexico. Step inside for the marble and gilt altar, then — if the bell-tower visit is running, weekends only and tickets at the door — climb it for a view over the tiled domes.',
    Icon: IconVenue,
  },
  {
    name: 'Capilla del Rosario',
    distance: '2 blocks · 5 min walk',
    blurb:
      'Tucked inside the Templo de Santo Domingo, this gold-leaf baroque chapel was called the eighth wonder of the New World when it opened in 1690. Free to enter, and worth going back to twice.',
    Icon: IconArch,
  },
  {
    name: 'Biblioteca Palafoxiana',
    distance: '1 block · 4 min walk',
    blurb:
      'The first public library in the Americas, founded in 1646 — 45,000 volumes on tiered cedar shelves, in a hall unchanged since the 1770s. Small entrance fee, closed Mondays.',
    Icon: IconBook,
  },
  {
    name: 'Casa de los Muñecos',
    distance: 'On the square · 1 min walk',
    blurb:
      'The tiled facade on the north-east corner is covered in caricatures of the councillors who tried to stop the owner building higher than they had. He won, and made sure everyone knew.',
    Icon: IconRosette,
  },
  {
    name: 'Ex-Convento de Santa Rosa',
    distance: '6 blocks · 10 min walk',
    blurb:
      'The Talavera-tiled convent kitchen where mole poblano was supposedly invented, now the city’s Talavera museum. Go before you eat the mole rather than after.',
    Icon: IconCuisine,
  },
  {
    name: 'Callejón de los Sapos',
    distance: '5 blocks · 8 min walk',
    blurb:
      'Antique shops by day, a flea market on Saturday and Sunday, cantinas with live music after dark. Stop at La Pasita in the afternoon before it shuts: one shot, one cube of cheese, one raisin.',
    Icon: IconGlass,
  },
  {
    name: 'Barrio del Artista & El Parián',
    distance: '4 blocks · 8 min walk',
    blurb:
      'Painters keep open studios around a small plaza, and El Parián next door is good for cheerful souvenirs. For certified Talavera, walk five blocks west to Uriarte instead — same workshop since 1824, and you can watch them paint it.',
    Icon: IconPalette,
  },
  {
    name: 'Museo Amparo',
    distance: '3 blocks · 8 min walk',
    blurb:
      'Pre-Hispanic and colonial collections in a beautifully restored mansion, and a rooftop terrace café with the best view of the cathedral in the city. Closed Tuesdays, not Mondays.',
    Icon: IconCamera,
  },
  {
    name: 'Fuertes de Loreto y Guadalupe',
    distance: '10 min by Uber',
    blurb:
      'The hill where the outnumbered Mexican army won on the fifth of May, 1862 — the reason the date means anything at all. Ramparts, a museum, and the long view back over the city.',
    Icon: IconFort,
  },
]

/** Where to eat and drink in the Centro. */
const ZOCALO_TABLE: readonly Note[] = [
  {
    title: 'Mole poblano',
    body: 'Puebla claims to have invented it, in a convent kitchen. Fonda de Santa Clara on 3 Poniente is the reliable classic and El Mural de los Poetas is where we would go for a proper dinner — have it with turkey, and skip the arcade restaurants on the square itself.',
  },
  {
    title: 'Chiles en nogada',
    body: 'The stuffed poblano under walnut cream is in season from late July to the end of September, when the nuez de Castilla comes in. If it is on the menu while you are here, order it — this is the city it was invented in.',
  },
  {
    title: 'Cemitas & tacos árabes',
    body: 'The city’s two great sandwiches. A cemita is a sesame roll with quesillo, avocado, chipotle and papalo — Mercado El Carmen for the real thing. Tacos árabes come off a vertical spit in pan árabe rather than a tortilla, and are worth staying up for.',
  },
  {
    title: 'Calle de los Dulces',
    body: '6 Oriente is lined with sweet shops — camotes, borrachitos and tortitas de Santa Clara, sold from the same doorways since before the revolution.',
  },
  {
    title: 'Profética',
    body: 'A bookshop and café in a colonial courtyard on 3 Sur, two blocks off the square. The best place in the Centro to lose an hour between events.',
  },
  {
    title: 'Sunset from a rooftop',
    body: 'The terraces on the square look straight at the cathedral, and on a clear evening Popocatépetl and Iztaccíhuatl sit off to the west, to your right. Best between November and April — in the rainy months they hide. Mezcal, and stay for the light.',
  },
]

/** Half-day trips that do not need a hotel change. */
const ZOCALO_NEARBY: readonly Note[] = [
  {
    title: 'Cholula — 20 minutes',
    body: 'The Great Pyramid is the largest by volume in the world, with a yellow church sitting on top of it. Walk the tunnel if it is open, climb up for the volcano view, then have lunch on the plaza below. Closed Mondays.',
  },
  {
    title: 'Tonantzintla & Acatepec — 30 minutes',
    body: 'Two village churches beside Cholula. Acatepec is the Talavera-tiled facade; Tonantzintla is the one to go inside, for a ceiling of indigenous saints, fruit and feathered angels carved by the villagers themselves. No photographs in there.',
  },
  {
    title: 'Atlixco — 45 minutes',
    body: 'A flower-growing town with a painted village square and the Cerro de San Miguel viewpoint over the valley. Spectacular in late September for the Huey Atlixcáyotl, and again for the Villa Iluminada in December.',
  },
  {
    title: 'Africam Safari — 30 minutes',
    body: 'A drive-through safari park south of the city — an easy morning with children. You need a car or their shuttle; Ubers do not linger out there.',
  },
]

/** The practical things nobody tells you until you are already here. */
const ZOCALO_PRACTICAL: readonly Note[] = [
  {
    title: 'Getting here from the airport',
    body: 'Estrella Roja and ADO run direct buses from both Mexico City airport terminals to Puebla, roughly hourly, about two and a half hours, bookable online. They drop at CAPU or the 4 Poniente terminal — either is a fifteen-minute Uber from the square, and far less painful than driving.',
  },
  {
    title: 'A word on Mondays',
    body: 'Almost every museum in Mexico closes on Monday, the Palafoxiana and the Cholula pyramid included. Museo Amparo is the odd one out and closes on Tuesday. Churches are open every day.',
  },
  {
    title: '2,135 metres',
    body: 'Puebla sits high. On your first day drink more water than you want to and let the mezcal go slowly — the altitude catches everyone out.',
  },
  {
    title: 'Cash & cards',
    body: 'Restaurants and hotels take cards; markets, the sweet shops and street taxis want pesos. Draw from a bank ATM and decline the machine’s own exchange rate. Ten to fifteen per cent is the tip.',
  },
  {
    title: 'Getting around',
    body: 'Uber and DiDi both work well here and cost very little across the Centro. Use them rather than street taxis, use them late at night, and use them to get out to Cholula.',
  },
  {
    title: 'What to pack',
    body: 'Warm afternoons and cold evenings, all year — bring a jacket even in August, and a rain layer between June and September. The Centro is cobbled, so flat shoes.',
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
      'ADO leaves Puebla’s CAPU terminal every twenty minutes and takes about two hours, arriving at TAPO on the east side. There are direct CAPU buses to the airport too — much better than crossing the city.',
    highlights: [
      'Museo Nacional de Antropología — the finest museum in the country. Give it half a day, then walk up to Chapultepec Castle for the view.',
      'The Centro Histórico: the Zócalo, Templo Mayor, Bellas Artes, and the Diego Rivera murals in the Palacio Nacional — bring your passport and check it is open.',
      'Frida Kahlo’s Casa Azul in Coyoacán — timed tickets sell out weeks ahead, so book online before you fly.',
      'Roma and Condesa for long lunches, tree-lined streets and cocktails afterwards.',
      'Teotihuacán, an hour north — arrive at opening, or float over the pyramids in a balloon.',
      'A Sunday on the Xochimilco canals — Cuemanco for calm, Nativitas for the party, and the boat price is per boat, per hour — or lucha libre at Arena México on a Friday.',
    ],
    Icon: IconPyramid,
  },
  {
    name: 'Oaxaca City',
    region: 'Oaxaca · 4½ hrs by road from Puebla, 1 hr by air from Mexico City',
    blurb:
      'The country’s food and craft capital — mezcal, seven moles and markets you would fly in for on their own. Two nights minimum, three if you can.',
    gettingThere:
      'There is no direct flight from Puebla: fly from Mexico City in an hour, take ADO straight from CAPU, or drive the 135D toll road through the mountains in four and a half hours — that one in daylight.',
    highlights: [
      'Mercado 20 de Noviembre for the Pasillo de Humo, the smoke-filled grill hall, with Mercado Benito Juárez next door.',
      'Santo Domingo and its cultural museum — the ethnobotanical garden is guided-tour only, and English tours run just a few times a week.',
      'Monte Albán, the Zapotec city on the ridge, thirty minutes above town, with Mitla and the vast tree at El Tule out in the valley.',
      'The Sunday market at Tlacolula, and the rug weavers and mezcal palenques of Teotitlán del Valle on the way.',
      'Hierve el Agua’s petrified waterfalls, best as an early start — check it is open first, the community closes the road from time to time.',
      'Book far ahead for Día de Muertos and the Guelaguetza in July; the whole city sells out months in advance.',
    ],
    Icon: IconAgave,
  },
  {
    name: 'Puerto Escondido',
    region: 'Oaxacan coast · 1 hr by air from Mexico City',
    blurb:
      'Where Mexico City goes to swim: barefoot, unpolished and warm all year. The easiest possible way to end a trip.',
    gettingThere:
      'An hour from Mexico City by air, or forty minutes from Oaxaca City in a twelve-seat prop plane — pack light, the bag limit is strict. The new highway has cut the drive down from Oaxaca to about three and a half hours.',
    highlights: [
      'Playa Carrizalillo for the calm swimming cove — there are a hundred and seventy steps down to it.',
      'Zicatela for the surf and the sunset, but do not get in the water there: it is the Mexican Pipeline, and the rips are lethal.',
      'Bioluminescence on the Manialtepec lagoon, on a moonless night.',
      'A dawn boat trip for dolphins and turtles — and whales in winter.',
      'Baby-turtle releases at Playa Bacocho most evenings in season.',
      'Mazunte and Zipolite, ninety minutes east, if you want somewhere quieter still.',
    ],
    Icon: IconWave,
  },
  {
    name: 'San Miguel de Allende',
    region: 'Guanajuato · 3½ hrs by road from Mexico City',
    blurb:
      'Cobblestones, rooftop bars and a pink church out of a fairy tale, in a town small enough to walk end to end. Made for a slow two nights.',
    gettingThere:
      'Fly into Querétaro (QRO) and drive an hour, or León (BJX) and drive an hour and three-quarters; comfortable buses also run from Mexico City.',
    highlights: [
      'The Parroquia de San Miguel Arcángel on the Jardín — best at golden hour from a rooftop, and the one everyone means is Luna at the Rosewood.',
      'Fábrica La Aurora, an old textile mill full of galleries and studios.',
      'Hot springs at La Gruta or Escondido Place, twenty minutes out — cash only, and packed at weekends.',
      'Atotonilco, the frescoed sanctuary fifteen minutes away, and the cactus gardens at El Charco del Ingenio.',
      'The Tuesday tianguis out on the Querétaro road — huge, cheap and not walkable, so take a taxi.',
      'Guanajuato city, ninety minutes away, for tunnels, callejones and colour.',
    ],
    Icon: IconChurch,
  },
]

const distanceClass = `${labelFont} text-[#B15C41] text-[0.56rem] uppercase tracking-[0.2em]`
const cardBodyClass = `${bodyFont} text-[#6F675D] text-sm leading-6`
const noteTitleClass = `${labelFont} font-semibold text-[#1D2320] text-[0.62rem] uppercase tracking-[0.2em]`

/** A titled list of short notes — used for the table and the day trips. */
function NoteList({ eyebrow, notes }: { eyebrow: string; notes: readonly Note[] }) {
  return (
    <div className='flex flex-col gap-5'>
      <Eyebrow>{eyebrow}</Eyebrow>
      <GoldRule className='self-start' />
      <ul className='flex flex-col gap-4'>
        {notes.map((note) => (
          <li key={note.title} className='flex flex-col gap-1'>
            <p className={noteTitleClass}>{note.title}</p>
            <p className={cardBodyClass}>{note.body}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * "Around the Zócalo" — the walkable Centro Histórico guide for guests staying
 * on or beside Puebla's main square, plus where to eat, the short drives that
 * fit into a free afternoon, and the practical things worth knowing on arrival.
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
          {ZOCALO_SIGHTS.map(({ name, distance, blurb, Icon }) => (
            <li
              key={name}
              className='flex flex-col gap-3 rounded-[3px] border border-[#DDD2C0] bg-[#FBF8F2] px-6 py-6'
            >
              <div className='flex items-start justify-between gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <h3 className={`${headingFont} text-[#1D2320] text-xl italic`}>{name}</h3>
                  <span className={distanceClass}>{distance}</span>
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

        <div className='flex w-full flex-col gap-6 rounded-[3px] border border-[#DDD2C0] bg-[#FBF8F2] px-7 py-8 sm:px-9'>
          <div className='flex flex-col gap-4'>
            <Eyebrow>Good to Know</Eyebrow>
            <GoldRule className='self-start' />
          </div>
          <ul className='grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3'>
            {ZOCALO_PRACTICAL.map((note) => (
              <li key={note.title} className='flex flex-col gap-1'>
                <p className={noteTitleClass}>{note.title}</p>
                <p className={cardBodyClass}>{note.body}</p>
              </li>
            ))}
          </ul>
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
                <span className={noteTitleClass}>Getting there · </span>
                {gettingThere}
              </p>
            </article>
          ))}
        </div>

        <p
          className={`${bodyFont} max-w-3xl text-balance text-center text-[#6F675D] text-[0.98rem] leading-7`}
        >
          And if you would rather not go far: the Puebla sierra is two and a half hours north, where
          Cuetzalan and Zacatlán sit in cloud forest above the waterfalls, and hardly anyone makes
          the trip.
        </p>

        <p className={`${scriptFont} text-center text-3xl text-[#B15C41]`}>
          Come for the wedding, stay for the country.
        </p>
      </div>
    </Band>
  )
}
