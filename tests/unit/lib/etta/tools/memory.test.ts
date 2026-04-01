/**
 * @jest-environment node
 */

import { searchMemory, writeMemory } from '~/lib/etta/memory/pgvector'
import { getMemoryTools } from '~/lib/etta/tools/memory'
import type { EttaContext } from '~/lib/etta/types'

jest.mock('~/lib/etta/memory/pgvector', () => ({
  searchMemory: jest.fn(),
  writeMemory: jest.fn(),
}))

const mockSearchMemory = searchMemory as jest.Mock
const mockWriteMemory = writeMemory as jest.Mock

const mockCtx: EttaContext = {
  weddingId: 'wedding-123',
  ettaActorId: 'actor-123',
  actor: 'couple',
  wedding: {
    groomFirstName: 'John',
    groomLastName: 'Doe',
    brideFirstName: 'Jane',
    brideLastName: 'Smith',
  },
  guestCount: 50,
  eventCount: 2,
  vendorCount: 3,
  pendingSuggestionCount: 1,
  recentMemories: [],
}

const toolOpts = { toolCallId: 'tc1', messages: [], abortSignal: undefined as never }

describe('getMemoryTools', () => {
  beforeEach(() => jest.clearAllMocks())

  const tools = getMemoryTools(mockCtx)

  describe('memory_read', () => {
    it('searches memories by keyword', async () => {
      const memories = [{ id: 'm1', content: 'Bride prefers peonies', createdAt: new Date() }]
      mockSearchMemory.mockResolvedValue(memories)

      const result = await tools.memory_read.execute({ query: 'flowers' }, toolOpts)

      expect(mockSearchMemory).toHaveBeenCalledWith('wedding-123', 'flowers')
      expect(result).toEqual(memories)
    })
  })

  describe('memory_write', () => {
    it('saves a new memory', async () => {
      mockWriteMemory.mockResolvedValue('mem-new')

      const result = await tools.memory_write.execute({ content: 'Budget is $50,000' }, toolOpts)

      expect(mockWriteMemory).toHaveBeenCalledWith('wedding-123', 'Budget is $50,000')
      expect(result).toEqual({ memoryId: 'mem-new', message: 'Memory saved' })
    })
  })
})
