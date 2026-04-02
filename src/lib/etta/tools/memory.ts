import { tool, zodSchema } from 'ai'
import { z } from 'zod'
import { searchMemory, writeMemory } from '~/lib/etta/memory/pgvector'
import type { EttaContext } from '~/lib/etta/types'

export function getMemoryTools(ctx: EttaContext) {
  return {
    memory_read: tool({
      description: 'Searches wedding memories by keyword',
      inputSchema: zodSchema(
        z.object({
          query: z.string(),
        })
      ),
      execute: async ({ query }) => {
        return searchMemory(ctx.weddingId, query)
      },
    }),

    memory_write: tool({
      description: 'Saves a new memory about the wedding',
      inputSchema: zodSchema(
        z.object({
          content: z.string(),
        })
      ),
      execute: async ({ content }) => {
        const memoryId = await writeMemory(ctx.weddingId, content)
        return { memoryId, message: 'Memory saved' }
      },
    }),
  }
}
