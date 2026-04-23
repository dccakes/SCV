/**
 * @jest-environment node
 */

const mockResolveEttaContext = jest.fn()
const mockGetPlannerTools = jest.fn()
const mockGetConciergeTools = jest.fn()
const mockBuildSystemPrompt = jest.fn()
const mockGateway = jest.fn()
const mockStreamText = jest.fn()

jest.mock('~/lib/etta/utils/resolve-context', () => ({
  resolveEttaContext: (...args: unknown[]) => mockResolveEttaContext(...args),
}))

jest.mock('~/lib/etta/personas/planner', () => ({
  getPlannerTools: (...args: unknown[]) => mockGetPlannerTools(...args),
}))

jest.mock('~/lib/etta/personas/concierge', () => ({
  getConciergeTools: (...args: unknown[]) => mockGetConciergeTools(...args),
}))

jest.mock('~/lib/etta/utils/build-system-prompt', () => ({
  buildSystemPrompt: (...args: unknown[]) => mockBuildSystemPrompt(...args),
}))

jest.mock('@ai-sdk/gateway', () => ({
  gateway: (...args: unknown[]) => mockGateway(...args),
}))

jest.mock('ai', () => ({
  stepCountIs: jest.fn(),
  streamText: (...args: unknown[]) => mockStreamText(...args),
}))

const mockLogAudit = jest.fn()
jest.mock('~/lib/etta/utils/audit', () => ({
  logAudit: (...args: unknown[]) => mockLogAudit(...args),
}))

import { runEttaAgent } from '~/lib/etta/agent'

describe('runEttaAgent', () => {
  const originalGatewayKey = process.env.AI_GATEWAY_API_KEY

  beforeEach(() => {
    jest.clearAllMocks()
    mockResolveEttaContext.mockResolvedValue({
      weddingId: 'wedding-1',
      ettaActorId: 'etta-1',
      actor: 'couple',
      wedding: {
        groomFirstName: 'Shrek',
        groomLastName: 'Ogre',
        brideFirstName: 'Fiona',
        brideLastName: 'Ogre',
      },
      guestCount: 14,
      eventCount: 3,
      vendorCount: 5,
      pendingSuggestionCount: 0,
      recentMemories: [],
    })
    mockGetPlannerTools.mockReturnValue({})
    mockGetConciergeTools.mockReturnValue({})
    mockBuildSystemPrompt.mockReturnValue('prompt')
  })

  afterAll(() => {
    if (originalGatewayKey === undefined) {
      delete process.env.AI_GATEWAY_API_KEY
      return
    }

    process.env.AI_GATEWAY_API_KEY = originalGatewayKey
  })

  it('throws a clear configuration error when AI_GATEWAY_API_KEY is missing', async () => {
    delete process.env.AI_GATEWAY_API_KEY

    await expect(
      runEttaAgent({
        actor: 'couple',
        weddingId: 'wedding-1',
        authz: { userId: 'user-1', activeOrganization: null },
        messages: [{ role: 'user', content: 'hello' }],
      })
    ).rejects.toThrow('Etta is not configured: AI_GATEWAY_API_KEY is missing')

    expect(mockGateway).not.toHaveBeenCalled()
    expect(mockStreamText).not.toHaveBeenCalled()
  })

  describe('couple-bot actor', () => {
    beforeEach(() => {
      process.env.AI_GATEWAY_API_KEY = 'test-key'
      mockResolveEttaContext.mockResolvedValue({
        weddingId: 'wedding-1',
        ettaActorId: 'etta-1',
        actor: 'couple-bot',
        wedding: {
          groomFirstName: 'Shrek',
          groomLastName: 'Ogre',
          brideFirstName: 'Fiona',
          brideLastName: 'Ogre',
        },
        guestCount: 14,
        eventCount: 3,
        vendorCount: 5,
        pendingSuggestionCount: 0,
        recentMemories: [],
      })
      mockStreamText.mockReturnValue({ toUIMessageStreamResponse: jest.fn() })
    })

    it('uses planner tools and records chat_request with actorType couple-bot', async () => {
      await runEttaAgent({
        actor: 'couple-bot',
        weddingId: 'wedding-1',
        authz: { userId: 'user-42', activeOrganization: null },
        messages: [{ role: 'user', content: 'hi from telegram' }],
      })

      expect(mockGetPlannerTools).toHaveBeenCalledTimes(1)
      expect(mockGetConciergeTools).not.toHaveBeenCalled()

      const chatRequestCall = mockLogAudit.mock.calls.find(
        ([entry]) => (entry as { action: string }).action === 'chat_request'
      )
      expect(chatRequestCall).toBeDefined()
      expect(chatRequestCall?.[0]).toMatchObject({
        actorType: 'couple-bot',
        actorId: 'user-42',
      })
    })

    it('falls back to couple-bot:unknown when authz.userId is missing', async () => {
      await runEttaAgent({
        actor: 'couple-bot',
        weddingId: 'wedding-1',
        messages: [{ role: 'user', content: 'hi' }],
      })

      const chatRequestCall = mockLogAudit.mock.calls.find(
        ([entry]) => (entry as { action: string }).action === 'chat_request'
      )
      expect(chatRequestCall?.[0]).toMatchObject({
        actorType: 'couple-bot',
        actorId: 'couple-bot:unknown',
      })
    })
  })

  describe('toolsetMode: memory-only', () => {
    beforeEach(() => {
      process.env.AI_GATEWAY_API_KEY = 'test-key'
      mockGetPlannerTools.mockReturnValue({
        memory_read: { kind: 'memory' },
        memory_write: { kind: 'memory' },
        vendor_list: { kind: 'vendor' },
        budget_read: { kind: 'budget' },
      })
      mockStreamText.mockReturnValue({ toUIMessageStreamResponse: jest.fn() })
    })

    it('restricts tools to memory tools only', async () => {
      await runEttaAgent({
        actor: 'couple',
        weddingId: 'wedding-1',
        authz: { userId: 'user-1', activeOrganization: null },
        messages: [{ role: 'user', content: 'wrap up' }],
        toolsetMode: 'memory-only',
      })

      expect(mockStreamText).toHaveBeenCalledTimes(1)
      const [[args]] = mockStreamText.mock.calls
      const tools = (args as { tools: Record<string, unknown> }).tools

      expect(Object.keys(tools).sort()).toEqual(['memory_read', 'memory_write'])
      expect(tools).not.toHaveProperty('vendor_list')
      expect(tools).not.toHaveProperty('budget_read')
    })

    it('passes toolsetMode through to buildSystemPrompt', async () => {
      await runEttaAgent({
        actor: 'couple',
        weddingId: 'wedding-1',
        authz: { userId: 'user-1', activeOrganization: null },
        messages: [{ role: 'user', content: 'wrap up' }],
        toolsetMode: 'memory-only',
      })

      expect(mockBuildSystemPrompt).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ toolsetMode: 'memory-only' })
      )
    })
  })
})
