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
  isStepCount: jest.fn(),
  streamText: (...args: unknown[]) => mockStreamText(...args),
}))

const mockLogAudit = jest.fn()
jest.mock('~/lib/etta/utils/audit', () => ({
  logAudit: (...args: unknown[]) => mockLogAudit(...args),
}))

const mockCaptureServerException = jest.fn()
jest.mock('~/server/infrastructure/observability/capture-exception', () => ({
  captureServerException: (...args: unknown[]) => mockCaptureServerException(...args),
}))

import { TRPCError } from '@trpc/server'

import { runEttaAgent } from '~/lib/etta/agent'

type StreamTextArgs = {
  onToolExecutionEnd: (event: {
    toolCall: { toolName: string }
    toolOutput: { type: 'tool-result'; output: unknown } | { type: 'tool-error'; error: unknown }
  }) => Promise<void> | void
  instructions: string
  runtimeContext: Record<string, unknown>
  telemetry: Record<string, unknown>
  onError: (event: { error: unknown }) => Promise<void> | void
}

const lastStreamTextArgs = (): StreamTextArgs =>
  mockStreamText.mock.calls.at(-1)?.[0] as StreamTextArgs

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

  describe('PostHog AI observability', () => {
    beforeEach(() => {
      process.env.AI_GATEWAY_API_KEY = 'test-key'
      delete process.env.ETTA_MODEL
      mockStreamText.mockReturnValue({ toUIMessageStreamResponse: jest.fn() })
    })

    it('passes the system prompt as v7 instructions', async () => {
      await runEttaAgent({
        actor: 'couple',
        weddingId: 'wedding-1',
        authz: { userId: 'user-1', activeOrganization: null },
        messages: [{ role: 'user', content: 'hi' }],
      })

      expect(lastStreamTextArgs().instructions).toBe('prompt')
      expect(lastStreamTextArgs()).not.toHaveProperty('system')
    })

    it('captures prompts and outputs and opts the PostHog context into telemetry', async () => {
      await runEttaAgent({
        actor: 'couple',
        weddingId: 'wedding-1',
        authz: { userId: 'user-1', activeOrganization: null },
        messages: [{ role: 'user', content: 'hi' }],
      })

      const { telemetry } = lastStreamTextArgs()
      expect(telemetry).toEqual({
        functionId: 'etta.couple',
        includeRuntimeContext: {
          distinctId: true,
          sessionId: true,
          browserSessionId: true,
          properties: true,
        },
      })
      expect(telemetry).not.toHaveProperty('recordInputs')
      expect(telemetry).not.toHaveProperty('recordOutputs')
    })

    it('attributes generations to the user, conversation, and replay session', async () => {
      await runEttaAgent({
        actor: 'couple',
        weddingId: 'wedding-1',
        authz: { userId: 'user-1', activeOrganization: null },
        messages: [{ role: 'user', content: 'hi' }],
        conversationId: 'chat-1',
        browserSessionId: 'replay-1',
      })

      expect(lastStreamTextArgs().runtimeContext).toEqual({
        distinctId: 'user-1',
        sessionId: 'chat-1',
        browserSessionId: 'replay-1',
        properties: {
          wedding_id: 'wedding-1',
          persona: 'couple',
          model: 'anthropic/claude-haiku-4.5',
          toolset_mode: 'full',
          environment: 'test',
        },
      })
    })

    it('never attaches a person to anonymous guest generations', async () => {
      await runEttaAgent({
        actor: 'guest',
        weddingId: 'wedding-1',
        guestId: 9,
        messages: [{ role: 'user', content: 'hi' }],
      })

      expect(lastStreamTextArgs().runtimeContext).not.toHaveProperty('distinctId')
    })

    it('reports stream failures to error tracking', async () => {
      await runEttaAgent({
        actor: 'couple',
        weddingId: 'wedding-1',
        authz: { userId: 'user-1', activeOrganization: null },
        messages: [{ role: 'user', content: 'hi' }],
      })
      const failure = new Error('provider overloaded')

      await lastStreamTextArgs().onError({ error: failure })

      expect(mockCaptureServerException).toHaveBeenCalledWith(failure, {
        userId: 'user-1',
        properties: expect.objectContaining({
          source: 'etta',
          persona: 'couple',
          wedding_id: 'wedding-1',
        }),
      })
    })
  })

  describe('tool failures', () => {
    const run = async () => {
      process.env.AI_GATEWAY_API_KEY = 'test-key'
      mockStreamText.mockReturnValue({})
      await runEttaAgent({
        actor: 'couple',
        weddingId: 'wedding-1',
        authz: { userId: 'user-1', activeOrganization: null },
        messages: [{ role: 'user', content: 'hi' }],
      })
      return lastStreamTextArgs().onToolExecutionEnd
    }

    beforeEach(() => mockCaptureServerException.mockClear())

    it('reports unexpected tool errors, which the model would otherwise swallow', async () => {
      const failure = new Error('database unavailable')
      await (await run())({
        toolCall: { toolName: 'guest_list' },
        toolOutput: { type: 'tool-error', error: failure },
      })

      expect(mockCaptureServerException).toHaveBeenCalledWith(failure, {
        userId: 'user-1',
        properties: expect.objectContaining({ source: 'etta-tool', tool_name: 'guest_list' }),
      })
    })

    it('skips expected outcomes such as permission denials and successful calls', async () => {
      const onToolExecutionEnd = await run()
      await onToolExecutionEnd({
        toolCall: { toolName: 'budget_write' },
        toolOutput: { type: 'tool-error', error: new TRPCError({ code: 'FORBIDDEN' }) },
      })
      await onToolExecutionEnd({
        toolCall: { toolName: 'guest_list' },
        toolOutput: { type: 'tool-result', output: [] },
      })

      expect(mockCaptureServerException).not.toHaveBeenCalled()
    })
  })
})
