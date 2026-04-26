import { tool, zodSchema } from 'ai'
import { z } from 'zod'

import { readPdfDocument } from '~/lib/etta/document-reader'
import type { EttaContext } from '~/lib/etta/types'
import { requirePlannerAuthz } from '~/lib/etta/utils/authorization'

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
        return readPdfDocument({ fileUrl, fileName })
      },
    }),
  }
}
