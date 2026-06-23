import { TRPCError } from '@trpc/server'

jest.mock('~/server/domains/website-section/website-section.repository', () =>
  require('~/server/domains/website-section/__mocks__/website-section.repository')
)

import {
  mockCreate,
  mockFindByWebsiteId,
  mockUpsertHomeSection,
  mockWebsiteSection,
  resetMocks,
  WebsiteSectionRepository,
} from '~/server/domains/website-section/website-section.repository'
import { WebsiteSectionService } from '~/server/domains/website-section/website-section.service'

describe('WebsiteSectionService', () => {
  let service: WebsiteSectionService

  beforeEach(() => {
    resetMocks()
    const repository = new WebsiteSectionRepository({})
    service = new WebsiteSectionService(repository)
  })

  describe('createHomeSection', () => {
    it('should create a default HOME section with an empty intro', async () => {
      mockCreate.mockResolvedValue(mockWebsiteSection)

      const result = await service.createHomeSection('website-123')

      expect(result).toEqual(mockWebsiteSection)
      expect(mockCreate).toHaveBeenCalledWith({
        websiteId: 'website-123',
        type: 'HOME',
        isEnabled: true,
        position: 0,
        content: { introText: '' },
      })
    })
  })

  describe('getByWebsiteId', () => {
    it('should return sections for a website ordered by position', async () => {
      mockFindByWebsiteId.mockResolvedValue([mockWebsiteSection])

      const result = await service.getByWebsiteId('website-123')

      expect(result).toEqual([mockWebsiteSection])
      expect(mockFindByWebsiteId).toHaveBeenCalledWith('website-123')
    })
  })

  describe('updateHomeSection', () => {
    it('should update the HOME section intro text', async () => {
      const updatedSection = {
        ...mockWebsiteSection,
        content: { introText: 'Welcome to our wedding website.' },
      }
      mockUpsertHomeSection.mockResolvedValue(updatedSection)

      const result = await service.updateHomeSection('website-123', {
        introText: 'Welcome to our wedding website.',
      })

      expect(result).toEqual(updatedSection)
      expect(mockUpsertHomeSection).toHaveBeenCalledWith('website-123', {
        introText: 'Welcome to our wedding website.',
      })
    })

    it('should reject intro text longer than 2000 characters', async () => {
      await expect(
        service.updateHomeSection('website-123', {
          introText: 'a'.repeat(2001),
        })
      ).rejects.toThrow(TRPCError)

      expect(mockUpsertHomeSection).not.toHaveBeenCalled()
    })
  })
})
