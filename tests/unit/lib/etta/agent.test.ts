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

jest.mock('~/lib/etta/utils/audit', () => ({
  logAudit: jest.fn(),
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
})
