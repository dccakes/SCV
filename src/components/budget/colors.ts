/**
 * Deterministic per-section colors for budget visualizations.
 *
 * Uses the design-system chart tokens (raw OKLCH values held in CSS variables)
 * so the allocation bar, legend, and any future charts stay on-brand in both
 * light and dark themes. Colors are assigned by section order and cycle once
 * there are more sections than tokens.
 */

const CHART_TOKENS = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'] as const

/** CSS color for the section at the given index, e.g. `oklch(var(--chart-2))`. */
export function sectionColor(index: number): string {
  const token = CHART_TOKENS[index % CHART_TOKENS.length]
  return `oklch(var(${token}))`
}
