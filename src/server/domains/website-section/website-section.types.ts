export const WebsiteSectionType = {
  HOME: 'HOME',
} as const

export type WebsiteSectionType = (typeof WebsiteSectionType)[keyof typeof WebsiteSectionType]

export type HomeSectionContent = {
  introText: string
}

export type WebsiteSection = {
  id: string
  websiteId: string
  type: WebsiteSectionType
  isEnabled: boolean
  position: number
  content: HomeSectionContent
  createdAt: Date
  updatedAt: Date
}
