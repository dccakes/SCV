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
  WebsiteSectionType.WEDDING_PARTY,
  WebsiteSectionType.TRAVEL,
  WebsiteSectionType.FAQ,
  WebsiteSectionType.REGISTRY,
] as const

export const homeSectionContentSchema = z.object({
  introText: z.string().max(2000, 'Intro text must be 2000 characters or fewer'),
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

export const travelSectionContentSchema = z.object({
  heading: z.string().max(120, 'Heading must be 120 characters or fewer'),
  body: z.string().max(4000, 'Travel details must be 4000 characters or fewer'),
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

/** Zod schema for each section type's content. */
export const sectionContentSchemaByType = {
  HOME: homeSectionContentSchema,
  OUR_STORY: ourStorySectionContentSchema,
  WEDDING_PARTY: weddingPartySectionContentSchema,
  TRAVEL: travelSectionContentSchema,
  FAQ: faqSectionContentSchema,
  REGISTRY: registrySectionContentSchema,
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
