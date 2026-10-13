import { TRPCError } from '@trpc/server'

jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(),
}))

jest.mock('~/server/domains/website/website.repository')
jest.mock('~/server/domains/wedding/wedding.repository')
jest.mock('~/server/domains/event/event.repository')
jest.mock('~/server/domains/website-section/website-section.repository')

import { WebsiteManagementService } from '~/server/application/website-management/website-management.service'
import { requirePermission } from '~/server/authz/permission-checker'
import {
  EventRepository,
  mockEvent,
  mockFindByWeddingIdWithQuestions,
  resetMocks as resetEventRepoMocks,
} from '~/server/domains/event/event.repository'
import {
  mockFindBySubUrl,
  mockFindBySubUrlWithQuestions,
  mockFindByWeddingId,
  mockUpsertByWeddingId,
  mockWebsite,
  mockWebsiteWithQuestions,
  resetMocks as resetWebsiteRepoMocks,
  WebsiteRepository,
} from '~/server/domains/website/website.repository'
import {
  mockFindByWebsiteId,
  mockFindByWebsiteIdAndType,
  mockUpsertByType,
  mockUpsertHomeSection,
  resetMocks as resetWebsiteSectionRepoMocks,
  WebsiteSectionRepository,
} from '~/server/domains/website-section/website-section.repository'
import {
  mockFindById as mockFindWeddingById,
  mockWedding,
  resetMocks as resetWeddingRepoMocks,
  WeddingRepository,
} from '~/server/domains/wedding/wedding.repository'

const mockRequirePermission = requirePermission as jest.Mock
const mockFindWebsiteByWeddingIdFn = mockFindByWeddingId as jest.Mock
const mockFindBySubUrlFn = mockFindBySubUrl as jest.Mock
const mockFindBySubUrlWithQuestionsFn = mockFindBySubUrlWithQuestions as jest.Mock
const mockUpsertWebsiteByWeddingIdFn = mockUpsertByWeddingId as jest.Mock
const mockFindWeddingByIdFn = mockFindWeddingById as jest.Mock
const mockFindByWeddingIdWithQuestionsFn = mockFindByWeddingIdWithQuestions as jest.Mock
const mockFindWebsiteSectionByTypeFn = mockFindByWebsiteIdAndType as jest.Mock
const mockFindWebsiteSectionsFn = mockFindByWebsiteId as jest.Mock
const mockUpsertHomeSectionFn = mockUpsertHomeSection as jest.Mock
const mockUpsertByTypeFn = mockUpsertByType as jest.Mock

const actorContext = {
  userId: 'actor-1',
  activeOrganization: null,
}

describe('WebsiteManagementService', () => {
  let service: WebsiteManagementService
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL
  const mockVerifyAccessToken = jest.fn()
  const mockIsInviteCodeValidForWedding = jest.fn()

  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://oswp.example'
    process.env.BETTER_AUTH_SECRET = 'test-secret-for-website-management'
    resetWebsiteRepoMocks()
    resetWeddingRepoMocks()
    resetEventRepoMocks()
    resetWebsiteSectionRepoMocks()
    mockVerifyAccessToken.mockReset()
    mockIsInviteCodeValidForWedding.mockReset().mockResolvedValue(false)
    mockRequirePermission.mockReset()
    mockRequirePermission.mockReturnValue({ organizationId: 'org-1', role: 'admin' })

    const websiteRepo = new WebsiteRepository({})
    const weddingRepo = new WeddingRepository({})
    const eventRepo = new EventRepository({})
    const websiteSectionRepo = new WebsiteSectionRepository({})

    service = new WebsiteManagementService(
      websiteRepo,
      weddingRepo,
      eventRepo,
      {
        verifyAccessToken: mockVerifyAccessToken,
      } as never,
      websiteSectionRepo,
      {
        isInviteCodeValidForWedding: mockIsInviteCodeValidForWedding,
      }
    )
  })

  afterAll(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl
  })

  describe('enableWebsite', () => {
    it('creates website from wedding data', async () => {
      mockFindWeddingByIdFn.mockResolvedValue(mockWedding)
      mockFindBySubUrlFn.mockResolvedValue(null)
      mockUpsertWebsiteByWeddingIdFn.mockResolvedValue(mockWebsite)

      const result = await service.enableWebsite(actorContext, 'wedding-123', {
        basePath: 'https://example.com',
        email: 'john@example.com',
      })

      expect(result).toEqual(mockWebsite)
      expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, { website: ['publish'] })
      expect(mockUpsertWebsiteByWeddingIdFn).toHaveBeenCalledWith({
        weddingId: 'wedding-123',
        subUrl: 'johndoeandjanesmith',
      })
    })

    it('creates website with a custom subUrl when provided', async () => {
      mockFindWeddingByIdFn.mockResolvedValue(mockWedding)
      mockFindBySubUrlFn.mockResolvedValue(null)
      mockUpsertWebsiteByWeddingIdFn.mockResolvedValue(mockWebsite)

      await service.enableWebsite(actorContext, 'wedding-123', {
        basePath: 'https://example.com',
        email: 'john@example.com',
        subUrl: 'hollyanddiego',
      })

      expect(mockUpsertWebsiteByWeddingIdFn).toHaveBeenCalledWith({
        weddingId: 'wedding-123',
        subUrl: 'hollyanddiego',
      })
    })

    it('returns the existing website when a concurrent upsert already created it', async () => {
      mockFindWeddingByIdFn.mockResolvedValue(mockWedding)
      mockFindBySubUrlFn.mockResolvedValue(null)
      mockUpsertWebsiteByWeddingIdFn.mockRejectedValue({ code: 'P2002' })
      mockFindWebsiteByWeddingIdFn.mockResolvedValue(mockWebsite)

      const result = await service.enableWebsite(actorContext, 'wedding-123', {
        basePath: 'https://example.com',
        email: 'john@example.com',
      })

      expect(result).toEqual(mockWebsite)
      expect(mockFindWebsiteByWeddingIdFn).toHaveBeenCalledWith('wedding-123')
    })

    it('fails when wedding does not exist', async () => {
      mockFindWeddingByIdFn.mockResolvedValue(null)

      await expect(
        service.enableWebsite(actorContext, 'wedding-123', {
          basePath: 'https://example.com',
          email: 'john@example.com',
        })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })

      expect(mockUpsertWebsiteByWeddingIdFn).not.toHaveBeenCalled()
    })

    it('fails when generated url is already taken', async () => {
      mockFindWeddingByIdFn.mockResolvedValue(mockWedding)
      mockFindBySubUrlFn.mockResolvedValue({
        ...mockWebsite,
        weddingId: 'different-wedding',
      })

      await expect(
        service.enableWebsite(actorContext, 'wedding-123', {
          basePath: 'https://example.com',
          email: 'john@example.com',
        })
      ).rejects.toMatchObject({
        code: 'CONFLICT',
      })

      expect(mockUpsertWebsiteByWeddingIdFn).not.toHaveBeenCalled()
    })

    it('surfaces a conflict when a concurrent create collides on subUrl for another wedding', async () => {
      mockFindWeddingByIdFn.mockResolvedValue(mockWedding)
      mockFindBySubUrlFn.mockResolvedValue(null)
      mockUpsertWebsiteByWeddingIdFn.mockRejectedValue({ code: 'P2002' })
      mockFindWebsiteByWeddingIdFn.mockResolvedValue(null)

      await expect(
        service.enableWebsite(actorContext, 'wedding-123', {
          basePath: 'https://example.com',
          email: 'john@example.com',
        })
      ).rejects.toMatchObject({
        code: 'CONFLICT',
      })
    })
  })

  describe('home section access', () => {
    it('returns the HOME section for the active wedding website', async () => {
      mockFindWebsiteByWeddingIdFn.mockResolvedValue(mockWebsite)
      mockFindWebsiteSectionByTypeFn.mockResolvedValue({
        id: 'section-123',
        websiteId: 'website-123',
        type: 'HOME',
        isEnabled: true,
        position: 0,
        content: { introText: 'Welcome' },
      })

      const result = await service.getHomeSection(actorContext, 'wedding-123')

      expect(result).toMatchObject({
        id: 'section-123',
        content: { introText: 'Welcome' },
      })
    })

    it('upserts the HOME section content for the active wedding website', async () => {
      mockFindWebsiteByWeddingIdFn.mockResolvedValue(mockWebsite)
      mockUpsertHomeSectionFn.mockResolvedValue({
        id: 'section-123',
        websiteId: 'website-123',
        type: 'HOME',
        isEnabled: true,
        position: 0,
        content: { introText: 'Updated intro' },
      })

      const result = await service.updateHomeSection(actorContext, 'wedding-123', {
        introText: 'Updated intro',
      })

      expect(result).toMatchObject({
        content: { introText: 'Updated intro' },
      })
      expect(mockUpsertHomeSectionFn).toHaveBeenCalledWith('website-123', {
        introText: 'Updated intro',
      })
    })
  })

  describe('section translations', () => {
    it('stores Spanish HOME copy alongside the English copy', async () => {
      mockFindWebsiteByWeddingIdFn.mockResolvedValue(mockWebsite)
      mockUpsertHomeSectionFn.mockResolvedValue({})

      await service.updateHomeSection(actorContext, 'wedding-123', {
        introText: 'Welcome',
        translations: { es: { introText: 'Bienvenidos' } },
      })

      expect(mockUpsertHomeSectionFn).toHaveBeenCalledWith(
        'website-123',
        { introText: 'Welcome' },
        { es: { introText: 'Bienvenidos' } }
      )
    })

    it('validates and stores Spanish section copy', async () => {
      mockFindWebsiteByWeddingIdFn.mockResolvedValue(mockWebsite)
      mockUpsertByTypeFn.mockResolvedValue({})

      await service.upsertSection(actorContext, 'wedding-123', {
        type: 'OUR_STORY',
        content: { heading: 'Our Story', body: 'Hi' },
        translations: { es: { heading: 'Nuestra historia', body: '' } },
      })

      expect(mockUpsertByTypeFn).toHaveBeenCalledWith(
        'website-123',
        'OUR_STORY',
        { heading: 'Our Story', body: 'Hi' },
        true,
        { es: { heading: 'Nuestra historia', body: '' } }
      )
    })

    it('rejects Spanish copy that does not fit the section shape', async () => {
      mockFindWebsiteByWeddingIdFn.mockResolvedValue(mockWebsite)

      await expect(
        service.upsertSection(actorContext, 'wedding-123', {
          type: 'OUR_STORY',
          content: { heading: 'Our Story', body: 'Hi' },
          translations: { es: { heading: 42 } },
        })
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('fetchWeddingData', () => {
    it('returns public page data with events', async () => {
      mockFindBySubUrlWithQuestionsFn.mockResolvedValue(mockWebsiteWithQuestions)
      mockFindWeddingByIdFn.mockResolvedValue(mockWedding)
      mockFindByWeddingIdWithQuestionsFn.mockResolvedValue([mockEvent])
      mockFindWebsiteSectionsFn.mockResolvedValue([
        {
          id: 'section-123',
          websiteId: 'website-123',
          type: 'HOME',
          isEnabled: true,
          position: 0,
          content: { introText: '' },
        },
        {
          id: 'section-story',
          websiteId: 'website-123',
          type: 'OUR_STORY',
          isEnabled: true,
          position: 1,
          content: { heading: 'Our Story', body: 'We met in Rome.' },
        },
        {
          id: 'section-travel-disabled',
          websiteId: 'website-123',
          type: 'TRAVEL',
          isEnabled: false,
          position: 3,
          content: { heading: 'Travel', body: 'Hidden' },
        },
      ])

      const result = await service.fetchWeddingData('johndoeandjanesmith', undefined)

      expect(result.groomFirstName).toBe('John')
      expect(result.website).toMatchObject({
        id: 'website-123',
        subUrl: 'johndoeandjanesmith',
        introText: '',
        url: 'https://oswp.example/w/johndoeandjanesmith',
      })
      expect(result.websiteBuilderEnabled).toBe(false)
      expect(result.website).not.toHaveProperty('password')
      expect(result.events).toHaveLength(1)
      // Only enabled, non-HOME sections are surfaced, in position order.
      expect(result.sections).toHaveLength(1)
      expect(result.sections[0]).toMatchObject({ type: 'OUR_STORY' })
    })

    it('serves Spanish content to Spanish visitors, falling back to English per field', async () => {
      mockFindBySubUrlWithQuestionsFn.mockResolvedValue({
        ...mockWebsiteWithQuestions,
        generalQuestions: [
          {
            id: 'q-general',
            eventId: null,
            websiteId: 'website-123',
            text: 'Any dietary needs?',
            type: 'Option',
            isRequired: false,
            allowOther: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            translations: { es: { text: '¿Alguna restricción alimentaria?' } },
            options: [
              {
                id: 'o1',
                questionId: 'q-general',
                text: 'Vegan',
                description: 'No animal products',
                responseCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                translations: { es: { text: 'Vegana', description: '' } },
              },
            ],
          },
        ],
      })
      mockFindWeddingByIdFn.mockResolvedValue(mockWedding)
      mockFindByWeddingIdWithQuestionsFn.mockResolvedValue([
        {
          ...mockEvent,
          translations: { es: { name: 'Boda', venue: 'Jardín', description: '' } },
          questions: [],
        },
      ])
      mockFindWebsiteSectionsFn.mockResolvedValue([
        {
          id: 'section-home',
          websiteId: 'website-123',
          type: 'HOME',
          isEnabled: true,
          position: 0,
          content: { introText: 'Welcome', headline: 'Hello' },
          translations: { es: { introText: 'Bienvenidos', headline: '' } },
        },
        {
          id: 'section-story',
          websiteId: 'website-123',
          type: 'OUR_STORY',
          isEnabled: true,
          position: 1,
          content: { heading: 'Our Story', body: 'We met in Rome.' },
          translations: { es: { heading: 'Nuestra historia', body: '' } },
        },
      ])

      const result = await service.fetchWeddingData(
        'johndoeandjanesmith',
        undefined,
        undefined,
        'es'
      )

      expect(result.website.introText).toBe('Bienvenidos')
      expect(result.website.headline).toBe('Hello')
      expect(result.sections[0]?.content).toEqual({
        heading: 'Nuestra historia',
        body: 'We met in Rome.',
      })
      expect(result.sections[0]).not.toHaveProperty('translations')
      expect(result.events[0]).toMatchObject({
        name: 'Boda',
        venue: 'Jardín',
        attire: 'Formal',
        description: 'Our special day!',
      })
      expect(result.events[0]).not.toHaveProperty('translations')
      // The wedding date is still found by the English event name.
      expect(result.date.standardFormat).toMatch(/ de jun/)
      const question = result.website.generalQuestions[0]
      expect(question?.text).toBe('¿Alguna restricción alimentaria?')
      expect(question?.options[0]).toMatchObject({
        text: 'Vegana',
        description: 'No animal products',
      })
    })

    it('ignores translations for English visitors', async () => {
      mockFindBySubUrlWithQuestionsFn.mockResolvedValue(mockWebsiteWithQuestions)
      mockFindWeddingByIdFn.mockResolvedValue(mockWedding)
      mockFindByWeddingIdWithQuestionsFn.mockResolvedValue([
        { ...mockEvent, translations: { es: { name: 'Boda' } }, questions: [] },
      ])
      mockFindWebsiteSectionsFn.mockResolvedValue([])

      const result = await service.fetchWeddingData('johndoeandjanesmith', undefined)

      expect(result.events[0]?.name).toBe('Wedding Day')
      expect(result.date.standardFormat).toMatch(/Jun/)
    })

    it('throws when website does not exist', async () => {
      mockFindBySubUrlWithQuestionsFn.mockResolvedValue(null)

      await expect(service.fetchWeddingData('missing-site', undefined)).rejects.toThrow(TRPCError)
    })

    it('throws forbidden when protected website access token is invalid', async () => {
      mockFindBySubUrlWithQuestionsFn.mockResolvedValue({
        ...mockWebsiteWithQuestions,
        isPasswordEnabled: true,
        password: '$hashed-password',
      })
      mockVerifyAccessToken.mockReturnValue(false)

      await expect(
        service.fetchWeddingData('johndoeandjanesmith', undefined)
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })

    it('grants access to a protected site when a valid household invite code matches the wedding', async () => {
      mockFindBySubUrlWithQuestionsFn.mockResolvedValue({
        ...mockWebsiteWithQuestions,
        isPasswordEnabled: true,
        password: '$hashed-password',
      })
      // No valid password access token for this guest.
      mockVerifyAccessToken.mockReturnValue(false)
      mockFindWeddingByIdFn.mockResolvedValue(mockWedding)
      mockFindByWeddingIdWithQuestionsFn.mockResolvedValue([mockEvent])
      mockFindWebsiteSectionsFn.mockResolvedValue([])
      mockIsInviteCodeValidForWedding.mockResolvedValue(true)

      const result = await service.fetchWeddingData('johndoeandjanesmith', undefined, 'al-4f9k2c')

      expect(result.groomFirstName).toBe('John')
      expect(mockIsInviteCodeValidForWedding).toHaveBeenCalledWith('al-4f9k2c', 'wedding-123')
    })

    it('still forbids a protected site when the invite code belongs to another wedding', async () => {
      mockFindBySubUrlWithQuestionsFn.mockResolvedValue({
        ...mockWebsiteWithQuestions,
        isPasswordEnabled: true,
        password: '$hashed-password',
      })
      mockVerifyAccessToken.mockReturnValue(false)
      mockIsInviteCodeValidForWedding.mockResolvedValue(false)

      await expect(
        service.fetchWeddingData('johndoeandjanesmith', undefined, 'other-wedding-code')
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })

    it('throws when wedding lookup fails for website', async () => {
      mockFindBySubUrlWithQuestionsFn.mockResolvedValue(mockWebsiteWithQuestions)
      mockFindWeddingByIdFn.mockResolvedValue(null)

      await expect(service.fetchWeddingData('johndoeandjanesmith', undefined)).rejects.toThrow(
        TRPCError
      )
      await expect(
        service.fetchWeddingData('johndoeandjanesmith', undefined)
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
      })
    })
  })
})
