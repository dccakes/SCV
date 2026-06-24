/**
 * Split a multi-line string into trimmed paragraphs (blank-line separated).
 * Shared by templates so each can own its own paragraph markup/styling.
 */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
}
