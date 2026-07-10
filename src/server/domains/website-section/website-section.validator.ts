import { z } from 'zod'

import {
  type SectionContentByType,
  type WebsiteSectionContent,
  WebsiteSectionType,
} from '~/server/domains/website-section/website-section.types'

/** Ordered tuple of every section type, for use in `z.enum`. */
export const WEBSITE_SECTION_TYPES = [
  WebsiteSectionType.HOME,
  WebsiteSectionType.OUR_STORY,
  WebsiteSectionType.TIMELINE,
  WebsiteSectionType.DESTINATION,
  WebsiteSectionType.EXPERIENCES,
  WebsiteSectionType.WEDDING_PARTY,
  WebsiteSectionType.TRAVEL,
  WebsiteSectionType.FAQ,
  WebsiteSectionType.REGISTRY,
  WebsiteSectionType.SAVE_THE_DATE,
  WebsiteSectionType.INVITATION,
] as const

export const homeSectionContentSchema = z.object({
  introText: z.string().max(2000, 'Intro text must be 2000 characters or fewer'),
  headline: z.string().max(160, 'Headline must be 160 characters or fewer').optional(),
  headlineAccent: z.string().max(40, 'Emphasis must be 40 characters or fewer').optional(),
})

export const ourStorySectionContentSchema = z.object({
  heading: z.string().max(120, 'Heading must be 120 characters or fewer'),
  body: z.string().max(4000, 'Story must be 4000 characters or fewer'),
})

export const weddingPartySectionContentSchema = z.object({
  heading: z.string().max(120, 'Heading must be 120 characters or fewer'),
  members: z
    .array(
      z.object({
        name: z.string().max(120, 'Name must be 120 characters or fewer'),
        role: z.string().max(120, 'Role must be 120 characters or fewer'),
        imageUrl: z
          .string()
          .url('Enter a valid image URL')
          .max(2000, 'Image URL must be 2000 characters or fewer')
          .optional(),
        blurb: z.string().max(1000, 'Blurb must be 1000 characters or fewer').optional(),
      })
    )
    .max(30, 'A wedding party can have up to 30 members'),
})

const eyebrowSchema = z.string().max(60, 'Label must be 60 characters or fewer').optional()
const optionalImageUrlSchema = z
  .string()
  .url('Enter a valid image URL')
  .max(2000, 'Image URL must be 2000 characters or fewer')
  .optional()
const optionalLinkUrlSchema = z
  .string()
  .url('Enter a valid URL')
  .max(500, 'URL must be 500 characters or fewer')
  .optional()

export const timelineSectionContentSchema = z.object({
  heading: z.string().max(120, 'Heading must be 120 characters or fewer'),
  eyebrow: eyebrowSchema,
  milestones: z
    .array(
      z.object({
        year: z.string().max(40, 'Year must be 40 characters or fewer'),
        title: z.string().max(120, 'Title must be 120 characters or fewer'),
        location: z.string().max(120, 'Location must be 120 characters or fewer').optional(),
      })
    )
    .max(12, 'You can add up to 12 milestones'),
})

export const destinationSectionContentSchema = z.object({
  eyebrow: eyebrowSchema,
  heading: z.string().max(160, 'Heading must be 160 characters or fewer'),
  body: z.string().max(2000, 'Description must be 2000 characters or fewer'),
  location: z.string().max(120, 'Location must be 120 characters or fewer').optional(),
  venueName: z.string().max(160, 'Venue name must be 160 characters or fewer').optional(),
  venueNote: z.string().max(200, 'Venue note must be 200 characters or fewer').optional(),
  ctaLabel: z.string().max(60, 'Button label must be 60 characters or fewer').optional(),
  ctaUrl: optionalLinkUrlSchema,
  imageUrl: optionalImageUrlSchema,
})

export const experiencesSectionContentSchema = z.object({
  heading: z.string().max(120, 'Heading must be 120 characters or fewer'),
  eyebrow: eyebrowSchema,
  items: z
    .array(
      z.object({
        title: z.string().max(120, 'Title must be 120 characters or fewer'),
        description: z.string().max(300, 'Description must be 300 characters or fewer').optional(),
        imageUrl: optionalImageUrlSchema,
      })
    )
    .max(12, 'You can add up to 12 experiences'),
})

export const travelSectionContentSchema = z.object({
  heading: z.string().max(120, 'Heading must be 120 characters or fewer'),
  body: z.string().max(4000, 'Travel details must be 4000 characters or fewer'),
  services: z
    .array(
      z.object({
        title: z.string().max(120, 'Title must be 120 characters or fewer'),
        description: z.string().max(300, 'Description must be 300 characters or fewer'),
      })
    )
    .max(8, 'You can add up to 8 services')
    .optional(),
  stays: z
    .array(
      z.object({
        name: z.string().max(160, 'Name must be 160 characters or fewer'),
        description: z.string().max(300, 'Description must be 300 characters or fewer').optional(),
        imageUrl: optionalImageUrlSchema,
        url: optionalLinkUrlSchema,
        blurb: z.string().max(1000, 'Blurb must be 1000 characters or fewer').optional(),
        buttonLabel: z.string().max(60, 'Button text must be 60 characters or fewer').optional(),
      })
    )
    .max(8, 'You can add up to 8 stays')
    .optional(),
})

export const faqSectionContentSchema = z.object({
  heading: z.string().max(120, 'Heading must be 120 characters or fewer'),
  items: z
    .array(
      z.object({
        question: z.string().max(300, 'Question must be 300 characters or fewer'),
        answer: z.string().max(2000, 'Answer must be 2000 characters or fewer'),
      })
    )
    .max(30, 'You can add up to 30 questions'),
})

export const registrySectionContentSchema = z.object({
  heading: z.string().max(120, 'Heading must be 120 characters or fewer'),
  body: z.string().max(2000, 'Registry note must be 2000 characters or fewer'),
  links: z
    .array(
      z.object({
        label: z.string().max(120, 'Label must be 120 characters or fewer'),
        url: z.string().url('Enter a valid URL').max(500, 'URL must be 500 characters or fewer'),
      })
    )
    .max(20, 'You can add up to 20 registry links'),
})

export const saveTheDateSectionContentSchema = z.object({
  eyebrow: z.string().max(60, 'Label must be 60 characters or fewer').optional(),
  message: z.string().max(600, 'Message must be 600 characters or fewer').optional(),
  footnote: z.string().max(160, 'Footnote must be 160 characters or fewer').optional(),
})

export const invitationSectionContentSchema = z.object({
  preface: z.string().max(160, 'Opening line must be 160 characters or fewer').optional(),
  invitationLine: z.string().max(200, 'Invitation line must be 200 characters or fewer').optional(),
  message: z.string().max(600, 'Message must be 600 characters or fewer').optional(),
})

/** Zod schema for each section type's content. */
export const sectionContentSchemaByType = {
  HOME: homeSectionContentSchema,
  OUR_STORY: ourStorySectionContentSchema,
  TIMELINE: timelineSectionContentSchema,
  DESTINATION: destinationSectionContentSchema,
  EXPERIENCES: experiencesSectionContentSchema,
  WEDDING_PARTY: weddingPartySectionContentSchema,
  TRAVEL: travelSectionContentSchema,
  FAQ: faqSectionContentSchema,
  REGISTRY: registrySectionContentSchema,
  SAVE_THE_DATE: saveTheDateSectionContentSchema,
  INVITATION: invitationSectionContentSchema,
} satisfies Record<WebsiteSectionType, z.ZodTypeAny>

/**
 * Validate and normalise raw section content against the schema for its type.
 * Throws a ZodError on mismatch.
 */
export function parseSectionContent<T extends WebsiteSectionType>(
  type: T,
  content: unknown
): SectionContentByType[T] {
  return sectionContentSchemaByType[type].parse(content) as SectionContentByType[T]
}

/** Validate content against a type without throwing. */
export function isValidSectionContent(type: WebsiteSectionType, content: unknown): boolean {
  return sectionContentSchemaByType[type].safeParse(content).success
}

const attachContentIssues = (
  type: WebsiteSectionType,
  content: unknown,
  ctx: z.RefinementCtx
): void => {
  const result = sectionContentSchemaByType[type].safeParse(content)
  if (!result.success) {
    for (const issue of result.error.issues) {
      ctx.addIssue({ ...issue, path: ['content', ...issue.path] })
    }
  }
}

/**
 * Internal create input. Content is validated against its type via superRefine
 * but left unchanged, so the parsed value deep-equals the input.
 */
export const createWebsiteSectionSchema = z
  .object({
    websiteId: z.string().min(1),
    type: z.enum(WEBSITE_SECTION_TYPES),
    isEnabled: z.boolean(),
    position: z.number().int().min(0),
    content: z.unknown(),
  })
  .superRefine((value, ctx) => attachContentIssues(value.type, value.content, ctx))

/**
 * tRPC input for updating a section: its type, the new content, and an optional
 * enabled flag. Content is validated against the section type.
 */
export const updateSectionSchema = z
  .object({
    type: z.enum(WEBSITE_SECTION_TYPES),
    isEnabled: z.boolean().optional(),
    content: z.unknown(),
  })
  .superRefine((value, ctx) => attachContentIssues(value.type, value.content, ctx))

/** Kept for the existing HOME-only editor endpoint. */
export const updateHomeSectionSchema = homeSectionContentSchema

export type CreateWebsiteSectionInput = {
  websiteId: string
  type: WebsiteSectionType
  isEnabled: boolean
  position: number
  content: WebsiteSectionContent
}
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>
export type UpdateHomeSectionInput = z.infer<typeof updateHomeSectionSchema>
