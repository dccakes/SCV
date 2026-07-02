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
  WebsiteSection,
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
          <p className={`${headingFont} text-2xl text-[#B15C41] italic`}>
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
              <span
                className={`${labelFont} text-[#1D2320] text-[0.66rem] uppercase tracking-[0.24em]`}
              >
                {milestone.title}
              </span>
              {milestone.location ? (
                <span className={`${bodyFont} text-[#6F675D] text-sm italic`}>
                  {milestone.location}
                </span>
              ) : null}
              <Decor
                name={MILESTONE_DECOR[index % MILESTONE_DECOR.length] ?? 'church'}
                className='mt-2 h-24 w-auto max-w-[12rem] object-contain'
                fallback={
                  <LandmarkSketch index={index} className='mt-2 h-12 w-auto text-[#7C7264]/80' />
                }
              />
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
              <li key={label} className='flex flex-col items-center gap-2 text-center'>
                <span className='flex h-12 w-12 items-center justify-center rounded-full border border-[#DDD2C0] text-[#B15C41]'>
                  <Icon className='h-6 w-6' />
                </span>
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
            <article
              key={`${item.title}`}
              className='group flex flex-col overflow-hidden rounded-[3px] border border-[#DDD2C0] bg-[#FBF8F2]'
            >
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
                    <BotanicalSprig className='h-1/2 w-auto text-[#B9965B]/30' />
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
 * The wedding party. Each portrait sits in a tall editorial frame; on hover a
 * champagne overlay fades in the member's blurb. On touch screens (no hover)
 * the blurb is shown beneath the portrait so it is never lost.
 */
export function VoyageWeddingParty({ content }: { content: WeddingPartySectionContent }) {
  if (content.members.length === 0) {
    return null
  }
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
        <div className='grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-4'>
          {content.members.map((member, index) => (
            <Fragment key={`${member.name}-${member.role}`}>
              {content.members.length >= 4 && index === Math.ceil(content.members.length / 2) ? (
                <div className='hidden flex-col items-center justify-center gap-4 rounded-[3px] border border-[#DDD2C0] bg-[#F7F3EC] px-6 py-10 text-center lg:flex'>
                  <p className={`${headingFont} text-2xl text-[#B15C41] italic leading-snug`}>
                    Thank you for being our people.
                  </p>
                  <Decor
                    name='floralCorner'
                    className='h-20 w-auto object-contain'
                    fallback={<HeartRule />}
                  />
                </div>
              ) : null}
              <div className='flex flex-col items-center gap-3 text-center'>
                <div className='group relative aspect-[4/5] w-full overflow-hidden rounded-[3px] border border-[#DDD2C0] bg-[#EFE7DA]'>
                  {member.imageUrl ? (
                    <Image
                      src={member.imageUrl}
                      alt={member.name}
                      fill
                      sizes='(max-width: 1024px) 50vw, 25vw'
                      className='object-cover transition-transform duration-700 group-hover:scale-[1.04]'
                    />
                  ) : (
                    <div className='flex h-full items-center justify-center'>
                      <span className={`${headingFont} text-5xl text-[#B15C41]`}>
                        {member.name?.[0] ?? '·'}
                      </span>
                    </div>
                  )}
                  {member.blurb ? (
                    <div className='absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#5A2C1E]/82 px-5 text-center opacity-0 backdrop-blur-[1px] transition-opacity duration-500 group-hover:opacity-100'>
                      <IconHeart className='h-5 w-5 text-[#E7C4BB]' />
                      <p className={`${bodyFont} text-[#F7F3EC] text-sm leading-6`}>
                        {member.blurb}
                      </p>
                    </div>
                  ) : null}
                </div>
                <p className={`${headingFont} text-2xl text-[#1D2320]`}>{member.name}</p>
                <p
                  className={`${labelFont} text-[#B15C41] text-[0.62rem] uppercase tracking-[0.24em]`}
                >
                  {member.role}
                </p>
                {member.blurb ? (
                  <p className={`${bodyFont} max-w-xs text-[#6F675D] text-sm leading-6 lg:hidden`}>
                    {member.blurb}
                  </p>
                ) : null}
              </div>
            </Fragment>
          ))}
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
        <ul className='mt-2 grid grid-cols-2 gap-x-6 gap-y-8'>
          {services.map((service, index) => {
            const Icon = SERVICE_ICONS[index % SERVICE_ICONS.length] ?? IconCompass
            return (
              <li key={`${service.title}`} className='flex flex-col items-center gap-2 text-center'>
                <span className='flex h-12 w-12 items-center justify-center rounded-full border border-[#DDD2C0] text-[#B15C41]'>
                  <Icon className='h-6 w-6' />
                </span>
                <p
                  className={`${labelFont} text-[#1D2320] text-[0.62rem] uppercase tracking-[0.2em]`}
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
        {stays.map((stay) => {
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
                <p
                  className={`${labelFont} text-[#1D2320] text-[0.62rem] uppercase tracking-[0.2em]`}
                >
                  {stay.name}
                </p>
                {stay.description ? (
                  <p className={`${bodyFont} text-[#6F675D] text-sm leading-6`}>
                    {stay.description}
                  </p>
                ) : null}
              </div>
            </>
          )
          const cardClass =
            'group flex flex-col overflow-hidden rounded-[3px] border border-[#DDD2C0] bg-[#FBF8F2]'
          return stay.url ? (
            <a
              key={`${stay.name}`}
              href={stay.url}
              target='_blank'
              rel='noreferrer'
              className={`${cardClass} transition-colors hover:border-[#B15C41]`}
            >
              {card}
            </a>
          ) : (
            <div key={`${stay.name}`} className={cardClass}>
              {card}
            </div>
          )
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
      <div className='flex flex-col'>
        {content.items.map((item) => (
          <details key={`${item.question}`} className='group border-[#DDD2C0] border-t py-4'>
            <summary className='flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden'>
              <span className={`${headingFont} text-[#1D2320] text-xl`}>{item.question}</span>
              <IconPlus className='h-4 w-4 shrink-0 text-[#B15C41] transition-transform duration-300 group-open:rotate-45' />
            </summary>
            <p className={`${bodyFont} mt-3 text-[#6F675D] text-[0.98rem] leading-7`}>
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
              className={`${labelFont} inline-flex items-center gap-2 rounded-[2px] border border-[#1D2320]/30 px-5 py-2.5 text-[#1D2320] text-[0.64rem] uppercase tracking-[0.22em] transition-colors hover:border-[#B9965B] hover:text-[#B9965B]`}
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
