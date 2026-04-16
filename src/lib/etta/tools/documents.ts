import { tool, zodSchema } from 'ai'
import { z } from 'zod'

import type { EttaContext } from '~/lib/etta/types'
import { requirePlannerAuthz } from '~/lib/etta/utils/authorization'

const MAX_CONTENT_CHARS = 12_000

export function getDocumentTools(ctx: EttaContext) {
  return {
    read_pdf: tool({
      description:
        'Extract and read the text content from a PDF file at a given URL. ' +
        'Use get_vendor_quote first to get file URLs from quote attachments, then pass the URL here. ' +
        'If the document is long, only the first portion is returned — ' +
        'inform the user and offer to focus on a specific section if needed.',
      inputSchema: zodSchema(
        z.object({
          fileUrl: z
            .string()
            .url()
            .describe('Direct URL to the PDF file (e.g. from a quote attachment)'),
          fileName: z.string().optional().describe('Optional: the file name for display context'),
        })
      ),
      execute: async ({ fileUrl, fileName }) => {
        requirePlannerAuthz(ctx)
        const response = await fetch(fileUrl)
        if (!response.ok) {
          return { error: `Failed to fetch file: HTTP ${response.status}` }
        }

        const contentType = response.headers.get('content-type') ?? ''
        if (!contentType.includes('pdf') && !fileUrl.toLowerCase().endsWith('.pdf')) {
          return { error: 'URL does not appear to be a PDF file' }
        }

        const buffer = await response.arrayBuffer()

        const { extractText } = await import('unpdf')
        const { text, totalPages } = await extractText(new Uint8Array(buffer), {
          mergePages: true,
        })

        const truncated = text.length > MAX_CONTENT_CHARS

        return {
          fileName: fileName ?? 'document.pdf',
          totalPages,
          totalCharacters: text.length,
          truncated,
          content: truncated ? text.slice(0, MAX_CONTENT_CHARS) : text,
          ...(truncated && {
            note: `Showing first ${MAX_CONTENT_CHARS.toLocaleString()} of ${text.length.toLocaleString()} characters across ${totalPages} pages. Ask the user if they want to focus on a specific section.`,
          }),
        }
      },
    }),
  }
}
