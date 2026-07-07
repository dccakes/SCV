/**
 * VoyageSections
 *
 * Voyage's editorial section layouts: an "About Us" feature, a horizontal story
 * timeline with hand-drawn landmark sketches, a two-column destination feature
 * with a highlights row, a wedding-party grid whose portraits reveal a blurb on
 * hover, and a combined Travel & Questions band (thin-line services + an FAQ
 * accordion). Each block is exported individually so the Home surface can
 * compose them in a bespoke editorial order; `VoyageSections` renders any
 * enabled sections in stored order to satisfy the template contract.
 */

import Image from 'next/image'
import { Fragment } from 'react'
import type {
  DestinationSectionContent,
  ExperiencesSectionContent,
  FaqSectionContent,
  OurStorySectionContent,
  RegistrySectionContent,
  TimelineSectionContent,
  TravelSectionContent,
  TravelStay,
  WebsiteSection,
  WeddingPartyMember,
  WeddingPartySectionContent,
} from '~/server/domains/website-section/website-section.types'
import { splitParagraphs } from '~/templates/shared/prose'
import { Decor, type DecorName } from '~/templates/voyage/components/decor'
import {
  BotanicalSprig,
  bodyFont,
  Eyebrow,
  FloralCorner,
  FloralSpray,
  GoldRule,
  HeartRule,
  headingFont,
  IconArch,
  IconArrow,
  IconBed,
  IconCamera,
  IconCar,
  IconClose,
  IconCompass,
  IconConcierge,
  IconCuisine,
  IconFerris,
  IconHeart,
  IconPlane,
  IconPlus,
  IconRosette,
  LandmarkSketch,
  labelFont,
  OutlineButton,
  scriptFont,
  sectionHeadingClass,
} from '~/templates/voyage/components/primitives'

/** Wrapper that gives every section consistent vertical rhythm and width. */
function Band({
  id,
  tone = 'ivory',
  className = '',
  children,
}: {
  id?: string
  tone?: 'ivory' | 'cream'
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className={`w-full scroll-mt-24 px-6 py-20 sm:py-24 lg:px-10 ${
        tone === 'cream' ? 'bg-[#FBF8F2]' : 'bg-[#F7F3EC]'
      } ${className}`}
    >
      <div className='mx-auto max-w-6xl'>{children}</div>
    </section>
  )
}

function CenteredHead({ eyebrow, heading }: { eyebrow?: string; heading: string }) {
  return (
    <div className='flex flex-col items-center gap-4 text-center'>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className={`${sectionHeadingClass} max-w-3xl text-balance`}>{heading}</h2>
      <HeartRule className='mt-1' />
    </div>
  )
}

function Prose({ text, className = '' }: { text: string; className?: string }) {
  const paragraphs = splitParagraphs(text)
  if (paragraphs.length === 0) {
    return null
  }
  return (
    <div className={`space-y-5 text-[#6F675D] text-[1.06rem] leading-8 ${bodyFont} ${className}`}>
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  )
}

/**
 * "About Us" — a two-column feature: the couple's story on the left and a
 * portrait on the right, framed by a soft botanical branch. Falls back to a
 * line-illustrated tile when no photo is available.
 */
export function VoyageOurStory({
  content,
  imageUrl,
}: {
  content: OurStorySectionContent
  imageUrl?: string | null
}) {
  if (!content.body.trim()) {
    return null
  }
  return (
    <Band id='our-story' className='overflow-hidden'>
      <div className='grid items-center gap-10 lg:grid-cols-2 lg:gap-16'>
        <div className='relative flex flex-col gap-6'>
          <Eyebrow>About Us</Eyebrow>
          <h2 className={`${sectionHeadingClass} leading-tight`}>
            {content.heading}
            <IconHeart className='ml-3 inline-block h-6 w-6 align-middle text-[#B15C41]' />
          </h2>
          <GoldRule className='self-start' />
          <Prose text={content.body} className='max-w-xl' />
          <p className={`${scriptFont} text-3xl text-[#B15C41]`}>
            Thank you for being part of our story.
          </p>
        </div>

        <div className='relative'>
          <Decor
            name='floralCorner2'
            className='pointer-events-none absolute -top-14 -right-10 hidden h-64 w-auto lg:block xl:-right-16'
            fallback={
              <FloralSpray className='pointer-events-none absolute top-1/2 -right-8 hidden h-[26rem] w-auto -translate-y-1/2 opacity-90 lg:block xl:-right-20' />
            }
          />
          <div className='relative z-10 aspect-[4/5] w-full overflow-hidden rounded-[3px] border border-[#DDD2C0]'>
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={content.heading}
                fill
                sizes='(max-width: 1024px) 100vw, 45vw'
                className='object-cover'
              />
            ) : (
              <div className='absolute inset-0 flex items-center justify-center bg-[#EFE7DA]'>
                <BotanicalSprig className='h-2/3 w-auto text-[#B15C41]/30' />
              </div>
            )}
          </div>
        </div>
      </div>
    </Band>
  )
}

/** Shared card chrome for the experiences and travel-stays grids. */
const CARD_CLASS =
  'group flex flex-col overflow-hidden rounded-[3px] border border-[#DDD2C0] bg-[#FBF8F2]'

/** Watercolour vignettes for the story milestones, in narrative order. */
const MILESTONE_DECOR: DecorName[] = ['coffee', 'mountains', 'ringBox', 'church']

export function VoyageTimeline({ content }: { content: TimelineSectionContent }) {
  if (content.milestones.length === 0) {
    return null
  }
  return (
    <Band id='timeline' tone='cream'>
      <div className='flex flex-col items-center gap-14'>
        <CenteredHead eyebrow={content.eyebrow ?? 'Our Story'} heading={content.heading} />
        <ol className='relative grid w-full gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6'>
          {/* The connecting champagne line across desktop columns. */}
          <span
            aria-hidden='true'
            className='absolute top-[0.4rem] right-[12%] left-[12%] hidden h-px bg-[#C9A87F]/50 lg:block'
          />
          {content.milestones.map((milestone, index) => (
            <li
              key={`${milestone.year}-${milestone.title}`}
              className='relative flex flex-col items-center gap-3 text-center'
            >
              {index > 0 ? (
                <IconHeart
                  aria-hidden='true'
                  className='absolute top-[-0.2rem] -left-3 hidden h-4 w-4 -translate-x-1/2 text-[#B15C41]/80 lg:block'
                />
              ) : null}
              <span
                aria-hidden='true'
                className='h-2 w-2 rounded-full border border-[#B15C41] bg-[#FBF8F2] ring-4 ring-[#FBF8F2]'
              />
              <span className={`${headingFont} font-light text-3xl text-[#B15C41]`}>
                {milestone.year}
              </span>
              <span className={`${headingFont} text-[#B15C41] text-xl italic`}>
                {milestone.title}
              </span>
              <Decor
                name={MILESTONE_DECOR[index % MILESTONE_DECOR.length] ?? 'church'}
                className='mt-2 h-24 w-auto max-w-[12rem] object-contain'
                fallback={
                  <LandmarkSketch index={index} className='mt-2 h-12 w-auto text-[#7C7264]/80' />
                }
              />
              {milestone.location ? (
                <span className={`${bodyFont} mt-1 max-w-[14rem] text-[#6F675D] text-sm leading-6`}>
                  {milestone.location}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </Band>
  )
}

/** The fixed destination highlights shown beneath the destination copy. */
const DESTINATION_HIGHLIGHTS = [
  { Icon: IconArch, label: 'Colonial Beauty' },
  { Icon: IconFerris, label: 'Rich Culture' },
  { Icon: IconCuisine, label: 'Incredible Cuisine' },
  { Icon: IconRosette, label: 'Warm Hospitality' },
] as const

export function VoyageDestination({ content }: { content: DestinationSectionContent }) {
  if (!content.body.trim() && !content.imageUrl) {
    return null
  }
  return (
    <Band id='destination' className='overflow-hidden'>
      <div className='grid items-stretch gap-10 lg:grid-cols-2 lg:gap-16'>
        <div className='relative min-h-[22rem] overflow-hidden rounded-[3px] border border-[#DDD2C0]'>
          {content.imageUrl ? (
            <Image
              src={content.imageUrl}
              alt={content.venueName ?? content.heading}
              fill
              sizes='(max-width: 1024px) 100vw, 50vw'
              className='object-cover'
            />
          ) : (
            <div className='absolute inset-0 flex items-center justify-center bg-[#EFE7DA]'>
              <BotanicalSprig className='h-2/3 w-auto text-[#B15C41]/30' />
            </div>
          )}
        </div>

        <div className='relative flex flex-col justify-center gap-6 py-2'>
          <Decor
            name='floralSpray'
            className='pointer-events-none absolute top-1/2 -right-14 hidden h-[26rem] w-auto -translate-y-1/2 lg:block xl:-right-28'
            fallback={
              <FloralSpray className='pointer-events-none absolute top-1/2 -right-10 hidden h-[24rem] w-auto -translate-y-1/2 opacity-90 lg:block xl:-right-24' />
            }
          />
          <Eyebrow>{content.eyebrow ?? 'The Destination'}</Eyebrow>
          <h2 className={`${sectionHeadingClass} leading-tight`}>
            {content.heading}
            <IconHeart className='ml-3 inline-block h-6 w-6 align-middle text-[#B15C41]' />
            {content.location ? (
              <span className='mt-1 block text-[#6F675D] italic'>{content.location}</span>
            ) : null}
          </h2>
          <Prose text={content.body} className='max-w-xl' />
          {content.venueName ? (
            <div className='border-[#B15C41]/40 border-l-2 pl-4'>
              <p className={`${headingFont} text-[#1D2320] text-xl`}>{content.venueName}</p>
              {content.venueNote ? (
                <p className={`${bodyFont} text-[#6F675D] text-sm italic`}>{content.venueNote}</p>
              ) : null}
            </div>
          ) : null}

          <ul className='mt-2 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4'>
            {DESTINATION_HIGHLIGHTS.map(({ Icon, label }) => (
              <li key={label} className='flex flex-col items-center gap-2.5 text-center'>
                <Icon className='h-9 w-9 text-[#8A7A66]' />
                <span
                  className={`${labelFont} text-[#6F675D] text-[0.56rem] uppercase leading-tight tracking-[0.18em]`}
                >
                  {label}
                </span>
              </li>
            ))}
          </ul>

          {content.ctaLabel && content.ctaUrl ? (
            <div className='pt-1'>
              <OutlineButton href={content.ctaUrl} external>
                {content.ctaLabel}
                <IconArrow className='h-4 w-4' />
              </OutlineButton>
            </div>
          ) : null}
        </div>
      </div>
    </Band>
  )
}

/**
 * Legacy "Curated Experiences" card row. The Home surface now feeds this
 * section's items into the Favorite Moments fotowall instead, but the standalone
 * renderer is kept for the section contract.
 */
export function VoyageExperiences({ content }: { content: ExperiencesSectionContent }) {
  if (content.items.length === 0) {
    return null
  }
  return (
    <Band id='experiences'>
      <div className='flex flex-col items-center gap-12'>
        <CenteredHead
          eyebrow={content.eyebrow ?? 'Curated Experiences'}
          heading={content.heading}
        />
        <div className='grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-4'>
          {content.items.map((item) => (
            <article key={`${item.title}`} className={CARD_CLASS}>
              <div className='relative aspect-[4/5] overflow-hidden bg-[#EFE7DA]'>
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes='(max-width: 1024px) 50vw, 25vw'
                    className='object-cover transition-transform duration-700 group-hover:scale-[1.05]'
                  />
                ) : (
                  <div className='flex h-full items-center justify-center'>
                    <BotanicalSprig className='h-1/2 w-auto text-[#B15C41]/30' />
                  </div>
                )}
              </div>
              <div className='flex flex-1 flex-col gap-2 px-5 py-6 text-center'>
                <h3 className={`${headingFont} text-2xl text-[#1D2320] italic`}>{item.title}</h3>
                {item.description ? (
                  <p className={`${bodyFont} text-[#6F675D] text-sm leading-6`}>
                    {item.description}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </Band>
  )
}

/**
 * One wedding-party portrait card. Members with a blurb are wrapped in a
 * fragment-link that opens a pure-CSS lightbox (via the `:target` pseudo-
 * class — no client JS) showing the full portrait beside the complete blurb,
 * so long bios never have to be truncated or squeezed into the card itself.
 * The card grid stays a uniform height either way.
 */
function WeddingPartyCard({ member, anchorId }: { member: WeddingPartyMember; anchorId: string }) {
  const initial = member.name?.[0] ?? '·'
  const card = (
    <div className='flex h-full w-full flex-col items-center gap-1.5 rounded-[3px] border border-[#DDD2C0] bg-[#FBF8F2] p-2 pb-4 text-center transition-colors group-hover:border-[#B15C41]/50'>
      <div className='relative aspect-[4/5] w-full overflow-hidden rounded-[2px] bg-[#EFE7DA]'>
        {member.imageUrl ? (
          <Image
            src={member.imageUrl}
            alt={member.name}
            fill
            sizes='(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 180px'
            className='object-cover'
          />
        ) : (
          <div className='flex h-full items-center justify-center'>
            <span className={`${headingFont} text-5xl text-[#B15C41]`}>{initial}</span>
          </div>
        )}
      </div>
      <p className={`${labelFont} mt-2 text-[#1D2320] text-[0.66rem] uppercase tracking-[0.22em]`}>
        {member.name}
      </p>
      <p className={`${bodyFont} text-[#6F675D] text-sm italic`}>{member.role}</p>
      {member.blurb ? (
        <span
          className={`${labelFont} mt-0.5 text-[#B15C41] text-[0.56rem] uppercase tracking-[0.18em]`}
        >
          Read more
        </span>
      ) : null}
    </div>
  )

  if (!member.blurb) {
    return card
  }

  return (
    <>
      <a
        href={`#${anchorId}`}
        className='group block h-full rounded-[3px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B15C41]/60'
      >
        {card}
      </a>
      <div
        id={anchorId}
        className='fixed inset-0 z-50 hidden items-start justify-center overflow-y-auto bg-[#1D2320]/75 p-4 py-10 target:flex sm:items-center'
      >
        <a href='#wedding-party' className='absolute inset-0'>
          <span className='sr-only'>Close</span>
        </a>
        <div className='relative flex w-full max-w-2xl flex-col overflow-hidden rounded-[3px] bg-[#FBF8F2] shadow-2xl sm:flex-row'>
          <a
            href='#wedding-party'
            aria-label='Close'
            className='absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#1D2320]/70 text-[#F7F3EC] transition-colors hover:bg-[#1D2320]'
          >
            <IconClose className='h-4 w-4' />
          </a>
          <div className='relative h-56 w-full shrink-0 overflow-hidden bg-[#EFE7DA] sm:h-auto sm:w-64'>
            {member.imageUrl ? (
              <Image
                src={member.imageUrl}
                alt={member.name}
                fill
                sizes='(max-width: 640px) 100vw, 256px'
                className='object-cover'
              />
            ) : (
              <div className='flex h-full items-center justify-center'>
                <span className={`${headingFont} text-6xl text-[#B15C41]`}>{initial}</span>
              </div>
            )}
          </div>
          <div className='flex flex-1 flex-col gap-3 p-7 text-left sm:p-8'>
            <p className={`${headingFont} text-2xl text-[#1D2320]`}>{member.name}</p>
            <p className={`${labelFont} text-[#B15C41] text-[0.62rem] uppercase tracking-[0.24em]`}>
              {member.role}
            </p>
            <GoldRule className='self-start' />
            <p className={`${bodyFont} text-[#6F675D] text-[0.98rem] leading-7`}>{member.blurb}</p>
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * The wedding party: a true grid (not a wrapped flex row) so portraits stay
 * aligned into even columns no matter how many members there are. Each card
 * is a uniform height; a member's full blurb — which can run long — opens in
 * a pure-CSS lightbox on click/tap instead of being squeezed into the card.
 */
export function VoyageWeddingParty({ content }: { content: WeddingPartySectionContent }) {
  if (content.members.length === 0) {
    return null
  }
  const midpoint = Math.ceil(content.members.length / 2)
  return (
    <Band id='wedding-party' tone='cream' className='relative overflow-hidden'>
      <Decor
        name='floralCorner'
        className='pointer-events-none absolute -right-8 -bottom-8 hidden h-56 w-auto lg:block'
        fallback={
          <FloralCorner className='pointer-events-none absolute top-6 right-4 hidden h-24 w-auto opacity-80 lg:block' />
        }
      />
      <Decor
        name='floralCorner2'
        className='pointer-events-none absolute -top-8 -left-8 hidden h-56 w-auto -scale-x-100 lg:block'
        fallback={
          <FloralCorner className='pointer-events-none absolute bottom-6 left-4 hidden h-24 w-auto -scale-x-100 -scale-y-100 opacity-80 lg:block' />
        }
      />
      <div className='relative flex flex-col items-center gap-12'>
        <CenteredHead eyebrow='Our People' heading={content.heading} />
        <div className='grid w-full grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6'>
          {content.members.map((member, index) => {
            const anchorId = `party-${index}-${member.name.replace(/\s+/g, '-').toLowerCase()}`
            return (
              <Fragment key={`${member.name}-${member.role}`}>
                {content.members.length >= 4 && index === midpoint ? (
                  <div className='hidden flex-col items-center justify-center gap-4 rounded-[3px] border border-[#DDD2C0] bg-[#FBF8F2] px-4 py-8 text-center lg:flex'>
                    <p className={`${scriptFont} text-2xl text-[#B15C41] leading-snug`}>
                      Thank you for being our people.
                    </p>
                    <Decor
                      name='floralCorner'
                      className='h-16 w-auto object-contain'
                      fallback={<HeartRule />}
                    />
                  </div>
                ) : null}
                <WeddingPartyCard member={member} anchorId={anchorId} />
              </Fragment>
            )
          })}
        </div>
      </div>
    </Band>
  )
}

const SERVICE_ICONS = [IconPlane, IconCar, IconBed, IconCamera, IconConcierge, IconCompass]

/** Travel copy + a responsive grid of thin-line services (no Band wrapper). */
function TravelContent({ content }: { content: TravelSectionContent }) {
  const services = content.services ?? []
  return (
    <div className='flex flex-col gap-6'>
      <Eyebrow>Travel &amp; Stay</Eyebrow>
      <h2 className={`${sectionHeadingClass} italic leading-tight`}>{content.heading}</h2>
      <GoldRule className='self-start' />
      <Prose text={content.body} />
      {services.length > 0 ? (
        <ul className='mt-2 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-4'>
          {services.map((service, index) => {
            const Icon = SERVICE_ICONS[index % SERVICE_ICONS.length] ?? IconCompass
            return (
              <li
                key={`${service.title}`}
                className='flex flex-col items-center gap-2.5 text-center'
              >
                <Icon className='h-9 w-9 text-[#8A7A66]' />
                <p
                  className={`${labelFont} font-semibold text-[#1D2320] text-[0.62rem] uppercase tracking-[0.2em]`}
                >
                  {service.title}
                </p>
                <p className={`${bodyFont} text-[#6F675D] text-sm leading-6`}>
                  {service.description}
                </p>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

/**
 * One recommended-stay card. Clicking it opens a pure-CSS lightbox (via the
 * `:target` pseudo-class, same technique as `WeddingPartyCard`) showing the
 * full photo beside the stay's blurb and an optional customizable link
 * button, so the card grid stays a uniform height either way.
 */
function StayCard({ stay, anchorId }: { stay: TravelStay; anchorId: string }) {
  const card = (
    <>
      <div className='relative aspect-[4/3] overflow-hidden bg-[#EFE7DA]'>
        {stay.imageUrl ? (
          <Image
            src={stay.imageUrl}
            alt={stay.name}
            fill
            sizes='(max-width: 1024px) 50vw, 25vw'
            className='object-cover transition-transform duration-700 group-hover:scale-[1.05]'
          />
        ) : (
          <div className='flex h-full items-center justify-center'>
            <BotanicalSprig className='h-1/2 w-auto text-[#B15C41]/30' />
          </div>
        )}
      </div>
      <div className='flex flex-col gap-1 px-4 py-4'>
        <p className={`${labelFont} text-[#1D2320] text-[0.62rem] uppercase tracking-[0.2em]`}>
          {stay.name}
        </p>
        {stay.description ? (
          <p className={`${bodyFont} text-[#6F675D] text-sm leading-6`}>{stay.description}</p>
        ) : null}
      </div>
    </>
  )

  if (!stay.blurb) {
    return (
      <div key={`${stay.name}`} className={CARD_CLASS}>
        {card}
      </div>
    )
  }

  return (
    <Fragment key={`${stay.name}`}>
      <a
        href={`#${anchorId}`}
        className={`${CARD_CLASS} group block transition-colors hover:border-[#B15C41] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B15C41]/60`}
      >
        {card}
      </a>
      <div
        id={anchorId}
        className='fixed inset-0 z-50 hidden items-start justify-center overflow-y-auto bg-[#1D2320]/75 p-4 py-10 target:flex sm:items-center'
      >
        <a href='#travel' className='absolute inset-0'>
          <span className='sr-only'>Close</span>
        </a>
        <div className='relative flex w-full max-w-2xl flex-col overflow-hidden rounded-[3px] bg-[#FBF8F2] shadow-2xl sm:flex-row'>
          <a
            href='#travel'
            aria-label='Close'
            className='absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#1D2320]/70 text-[#F7F3EC] transition-colors hover:bg-[#1D2320]'
          >
            <IconClose className='h-4 w-4' />
          </a>
          <div className='relative h-56 w-full shrink-0 overflow-hidden bg-[#EFE7DA] sm:h-auto sm:w-64'>
            {stay.imageUrl ? (
              <Image
                src={stay.imageUrl}
                alt={stay.name}
                fill
                sizes='(max-width: 640px) 100vw, 256px'
                className='object-cover'
              />
            ) : (
              <div className='flex h-full items-center justify-center'>
                <BotanicalSprig className='h-1/2 w-auto text-[#B15C41]/30' />
              </div>
            )}
          </div>
          <div className='flex flex-1 flex-col gap-3 p-7 text-left sm:p-8'>
            <p className={`${headingFont} text-2xl text-[#1D2320]`}>{stay.name}</p>
            <GoldRule className='self-start' />
            <p className={`${bodyFont} text-[#6F675D] text-[0.98rem] leading-7`}>{stay.blurb}</p>
            {stay.url ? (
              <a
                href={stay.url}
                target='_blank'
                rel='noreferrer'
                className={`${labelFont} mt-2 inline-flex w-fit items-center gap-2 rounded-[2px] bg-[#B15C41] px-5 py-2.5 text-[#FBF8F2] text-[0.62rem] uppercase tracking-[0.2em] transition-colors hover:bg-[#8A4530]`}
              >
                {stay.buttonLabel?.trim() || 'Visit Website'}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </Fragment>
  )
}

/** Recommended-stay cards (no Band wrapper). */
function StaysGrid({ content }: { content: TravelSectionContent }) {
  const stays = content.stays ?? []
  if (stays.length === 0) {
    return null
  }
  return (
    <div className='mt-14 flex flex-col gap-5'>
      <Eyebrow>Recommended Stays</Eyebrow>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {stays.map((stay, index) => {
          const anchorId = `stay-${index}-${stay.name.replace(/\s+/g, '-').toLowerCase()}`
          return <StayCard key={`${stay.name}`} stay={stay} anchorId={anchorId} />
        })}
      </div>
    </div>
  )
}

/** The FAQ as a champagne-ruled accordion (no Band wrapper). */
function FaqContent({ content }: { content: FaqSectionContent }) {
  return (
    <div className='flex flex-col gap-6'>
      <Eyebrow>Questions?</Eyebrow>
      <h2 className={`${sectionHeadingClass} italic leading-tight`}>{content.heading}</h2>
      <GoldRule className='self-start' />
      <div className='flex flex-col gap-3'>
        {content.items.map((item) => (
          <details
            key={`${item.question}`}
            className='group rounded-[2px] border border-[#DDD2C0] bg-[#F7F3EC] px-4 py-3.5'
          >
            <summary className='flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden'>
              <span className={`${headingFont} text-[#1D2320] text-lg`}>{item.question}</span>
              <IconPlus className='h-4 w-4 shrink-0 text-[#B15C41] transition-transform duration-300 group-open:rotate-45' />
            </summary>
            <p className={`${bodyFont} mt-2.5 text-[#6F675D] text-[0.98rem] leading-7`}>
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </div>
  )
}

/**
 * Combined Travel & Questions band, mirroring the design's side-by-side layout.
 * Renders whichever of the two is present; when both exist they sit in a
 * two-column grid on large screens. Recommended stays span full width beneath.
 */
export function VoyageTravelFaq({
  travel,
  faq,
}: {
  travel?: TravelSectionContent | null
  faq?: FaqSectionContent | null
}) {
  const hasTravel =
    !!travel &&
    (travel.body.trim().length > 0 ||
      (travel.services?.length ?? 0) > 0 ||
      (travel.stays?.length ?? 0) > 0)
  const hasFaq = !!faq && faq.items.length > 0
  if (!hasTravel && !hasFaq) {
    return null
  }
  return (
    <Band id='travel' tone='cream' className='relative overflow-hidden'>
      <Decor
        name='floralBranch'
        className='pointer-events-none absolute top-10 -right-8 hidden h-[24rem] w-auto lg:block xl:right-0'
        fallback={
          <FloralSpray className='pointer-events-none absolute top-10 -right-10 hidden h-[26rem] w-auto opacity-90 lg:block xl:right-0' />
        }
      />
      <Decor
        name='floralCorner'
        className='pointer-events-none absolute -bottom-8 -left-8 hidden h-48 w-auto -scale-x-100 lg:block'
        fallback={
          <FloralCorner className='pointer-events-none absolute bottom-6 left-2 hidden h-24 w-auto -scale-x-100 -scale-y-100 opacity-70 lg:block' />
        }
      />
      <div
        className={`relative grid gap-14 ${hasTravel && hasFaq ? 'lg:grid-cols-2 lg:gap-16' : ''}`}
      >
        {hasTravel && travel ? <TravelContent content={travel} /> : null}
        {hasFaq && faq ? (
          <div id='faq' className='scroll-mt-24'>
            <FaqContent content={faq} />
          </div>
        ) : null}
      </div>
      {hasTravel && travel ? <StaysGrid content={travel} /> : null}
    </Band>
  )
}

/** Standalone Travel band for the section-contract renderer. */
export function VoyageTravel({ content }: { content: TravelSectionContent }) {
  const services = content.services ?? []
  const stays = content.stays ?? []
  if (!content.body.trim() && services.length === 0 && stays.length === 0) {
    return null
  }
  return (
    <Band id='travel'>
      <TravelContent content={content} />
      <StaysGrid content={content} />
    </Band>
  )
}

/** Standalone FAQ band for the section-contract renderer. */
export function VoyageFaq({ content }: { content: FaqSectionContent }) {
  if (content.items.length === 0) {
    return null
  }
  return (
    <Band id='faq' tone='cream'>
      <div className='mx-auto max-w-3xl'>
        <FaqContent content={content} />
      </div>
    </Band>
  )
}

export function VoyageRegistry({ content }: { content: RegistrySectionContent }) {
  return (
    <div className='flex flex-col gap-6'>
      <Eyebrow>Registry</Eyebrow>
      <h2 className={`${sectionHeadingClass} leading-tight`}>{content.heading}</h2>
      <GoldRule className='self-start' />
      <Prose text={content.body} />
      {content.links.length > 0 ? (
        <div className='flex flex-wrap gap-3 pt-2'>
          {content.links.map((link) => (
            <a
              key={`${link.label}-${link.url}`}
              href={link.url}
              target='_blank'
              rel='noreferrer'
              className={`${labelFont} inline-flex items-center gap-2 rounded-[2px] border border-[#1D2320]/30 px-5 py-2.5 text-[#1D2320] text-[0.64rem] uppercase tracking-[0.22em] transition-colors hover:border-[#B15C41] hover:text-[#B15C41]`}
            >
              {link.label}
              <IconArrow className='h-4 w-4' />
            </a>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/**
 * Contract renderer: render any enabled sections in their stored order. The
 * Home surface composes the bespoke editorial order itself, so this is a
 * straightforward fallback (also used by any future surface that opts in).
 */
export function VoyageSections({ sections }: { sections: WebsiteSection[] }) {
  if (sections.length === 0) {
    return null
  }
  return (
    <>
      {sections.map((section) => {
        switch (section.type) {
          case 'OUR_STORY':
            return <VoyageOurStory key={section.id} content={section.content} />
          case 'TIMELINE':
            return <VoyageTimeline key={section.id} content={section.content} />
          case 'DESTINATION':
            return <VoyageDestination key={section.id} content={section.content} />
          case 'EXPERIENCES':
            return <VoyageExperiences key={section.id} content={section.content} />
          case 'WEDDING_PARTY':
            return <VoyageWeddingParty key={section.id} content={section.content} />
          case 'TRAVEL':
            return <VoyageTravel key={section.id} content={section.content} />
          case 'FAQ':
            return <VoyageFaq key={section.id} content={section.content} />
          case 'REGISTRY':
            return (
              <Band key={section.id} id='registry' tone='cream'>
                <VoyageRegistry content={section.content} />
              </Band>
            )
          default:
            return null
        }
      })}
    </>
  )
}
