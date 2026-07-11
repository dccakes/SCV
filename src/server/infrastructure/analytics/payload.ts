/**
 * Payload sanitization for analytics events
 *
 * The goal (per product requirement) is to attach the mutation payload to each
 * backend event so it doubles as a lightweight backup of "what was sent" while
 * the app is being tested. To keep events safe and bounded we:
 *
 * - redact individually huge string fields (base64 file blobs, etc.),
 * - cap the total serialized size and flag truncation, and
 * - never throw (circular structures, exotic values are tolerated).
 */

/** Fields larger than this many characters are redacted individually. */
const MAX_FIELD_CHARS = 4_000
/** Approximate cap on the total serialized payload size. */
const MAX_TOTAL_CHARS = 30_000

function redactLargeStrings(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.length > MAX_FIELD_CHARS ? `[redacted: ${value.length} chars]` : value
  }
  if (Array.isArray(value)) {
    return value.map(redactLargeStrings)
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = redactLargeStrings(val)
    }
    return out
  }
  return value
}

/**
 * Sanitize an arbitrary tRPC input into a bounded, analytics-safe payload
 * object. Returns `undefined` when there is nothing meaningful to record.
 */
export function sanitizePayload(input: unknown): Record<string, unknown> | undefined {
  if (input === undefined || input === null) {
    return undefined
  }

  const base: Record<string, unknown> =
    typeof input === 'object' ? (input as Record<string, unknown>) : { value: input }

  let redacted: Record<string, unknown>
  try {
    redacted = redactLargeStrings(base) as Record<string, unknown>
  } catch {
    return { __unserializable: true }
  }

  // Enforce a total size budget. `JSON.stringify` with a replacer safely drops
  // circular references so we never throw on exotic structures.
  const seen = new WeakSet<object>()
  let serialized: string
  try {
    serialized = JSON.stringify(redacted, (_key, val) => {
      if (val && typeof val === 'object') {
        if (seen.has(val as object)) {
          return '[circular]'
        }
        seen.add(val as object)
      }
      return val
    })
  } catch {
    return { __unserializable: true }
  }

  if (serialized && serialized.length > MAX_TOTAL_CHARS) {
    return { __truncated: true, preview: serialized.slice(0, MAX_TOTAL_CHARS) }
  }

  return redacted
}
