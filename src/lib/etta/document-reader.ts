const MAX_CONTENT_CHARS = 12_000
const EMPTY_TEXT_NOTE =
  'No extractable text was found in this PDF. It may be scanned, image-only, or otherwise not text-readable.'
const PDF_READ_FAILURE_DETAIL = 'read_failed'

type PromiseWithTry = PromiseConstructor & {
  try?: <T>(fn: () => T | PromiseLike<T>) => Promise<Awaited<T>>
}

type ExtractTextFn = typeof import('unpdf')['extractText']

export type PdfReadResult =
  | {
      status: 'ok' | 'truncated' | 'no_text'
      fileName: string
      totalPages: number
      totalCharacters: number
      truncated: boolean
      content: string
      note?: string
    }
  | {
      status: 'fetch_error' | 'invalid_file' | 'parse_error'
      error: string
      detail?: typeof PDF_READ_FAILURE_DETAIL
    }

function ensurePromiseTryPolyfill() {
  const promiseWithTry = Promise as PromiseWithTry
  if (promiseWithTry.try) return

  // `unpdf@1.6.0` currently expects `Promise.try` in our Node runtime path.
  // Install the narrowest compatibility shim we can before loading it.
  promiseWithTry.try = <T>(fn: () => T | PromiseLike<T>) =>
    new Promise<Awaited<T>>((resolve, reject) => {
      try {
        Promise.resolve(fn()).then(resolve, reject)
      } catch (error) {
        reject(error)
      }
    })
}

let extractTextLoader: Promise<ExtractTextFn> | null = null

async function loadExtractText(): Promise<ExtractTextFn> {
  ensurePromiseTryPolyfill()
  extractTextLoader ??= import('unpdf').then((mod) => mod.extractText)
  return extractTextLoader
}

export async function readPdfDocument(input: {
  fileUrl: string
  fileName?: string
}): Promise<PdfReadResult> {
  const { fileUrl, fileName } = input
  const response = await fetch(fileUrl)
  if (!response.ok) {
    return {
      status: 'fetch_error',
      error: `Failed to fetch file: HTTP ${response.status}`,
    }
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('pdf') && !fileUrl.toLowerCase().endsWith('.pdf')) {
    return {
      status: 'invalid_file',
      error: 'URL does not appear to be a PDF file',
    }
  }

  try {
    const buffer = await response.arrayBuffer()
    const extractText = await loadExtractText()
    const { text, totalPages } = await extractText(new Uint8Array(buffer), {
      mergePages: true,
    })

    const hasExtractableText = /\S/.test(text)
    const truncated = hasExtractableText && text.length > MAX_CONTENT_CHARS

    return {
      status: !hasExtractableText ? 'no_text' : truncated ? 'truncated' : 'ok',
      fileName: fileName ?? 'document.pdf',
      totalPages,
      totalCharacters: text.length,
      truncated,
      content: !hasExtractableText ? '' : truncated ? text.slice(0, MAX_CONTENT_CHARS) : text,
      ...(!hasExtractableText
        ? { note: EMPTY_TEXT_NOTE }
        : truncated
          ? {
              note: `Showing first ${MAX_CONTENT_CHARS.toLocaleString()} of ${text.length.toLocaleString()} characters across ${totalPages} pages. Ask the user if they want to focus on a specific section.`,
            }
          : {}),
    }
  } catch {
    return {
      status: 'parse_error',
      error: 'Failed to read PDF content',
      detail: PDF_READ_FAILURE_DETAIL,
    }
  }
}
