import { z } from 'zod'

import { WebsiteSectionType } from '~/server/domains/website-section/website-section.types'

export const homeSectionContentSchema = z.object({
  introText: z.string().max(2000, 'Intro text must be 2000 characters or fewer'),
})

export const createWebsiteSectionSchema = z.object({
  websiteId: z.string().min(1),
  type: z.enum([WebsiteSectionType.HOME]),
  isEnabled: z.boolean(),
  position: z.number().int().min(0),
  content: homeSectionContentSchema,
})

export const updateHomeSectionSchema = homeSectionContentSchema

export type CreateWebsiteSectionInput = z.infer<typeof createWebsiteSectionSchema>
export type UpdateHomeSectionInput = z.infer<typeof updateHomeSectionSchema>
