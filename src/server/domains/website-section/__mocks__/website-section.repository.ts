import type { WebsiteSection } from '~/server/domains/website-section/website-section.types'

export const mockWebsiteSection: WebsiteSection = {
  id: 'section-123',
  websiteId: 'website-123',
  type: 'HOME',
  isEnabled: true,
  position: 0,
  content: { introText: '' },
  createdAt: new Date('2026-04-24T00:00:00.000Z'),
  updatedAt: new Date('2026-04-24T00:00:00.000Z'),
}

export const mockCreate = jest.fn()
export const mockFindByWebsiteId = jest.fn()
export const mockFindByWebsiteIdAndType = jest.fn()
export const mockUpdate = jest.fn()
export const mockUpsertHomeSection = jest.fn()

export const WebsiteSectionRepository = jest.fn().mockImplementation(() => ({
  create: mockCreate,
  findByWebsiteId: mockFindByWebsiteId,
  findByWebsiteIdAndType: mockFindByWebsiteIdAndType,
  update: mockUpdate,
  upsertHomeSection: mockUpsertHomeSection,
}))

export const resetMocks = (): void => {
  mockCreate.mockReset()
  mockFindByWebsiteId.mockReset()
  mockFindByWebsiteIdAndType.mockReset()
  mockUpdate.mockReset()
  mockUpsertHomeSection.mockReset()
  WebsiteSectionRepository.mockClear()
}
