/**
 * AI email triage.
 *
 * Given an inbound message plus lightweight wedding context, classify it and
 * propose the best next actions (reply, forward a contract to the couple, log
 * the exchange, create a task, …). Uses the Vercel AI Gateway via
 * `generateObject`. When no gateway key is configured we fall back to a small
 * keyword heuristic so the inbound pipeline still records something useful.
 */

import { gateway } from '@ai-sdk/gateway'
import { generateObject } from 'ai'
import { z } from 'zod'
import type { InboundAttachment } from '~/lib/email/resend-webhook'

const DEFAULT_MODEL = 'anthropic/claude-haiku-4.5'

export const EMAIL_CATEGORIES = [
  'guest_rsvp',
  'guest_question',
  'vendor_contract',
  'vendor_quote',
  'vendor_general',
  'logistics',
  'spam',
  'other',
] as const
export type EmailCategory = (typeof EMAIL_CATEGORIES)[number]

export const EMAIL_ACTION_TYPES = [
  'reply_draft',
  'forward_to_couple',
  'forward_to_vendor',
  'create_task',
  'log_communication',
  'flag_guest_question',
  'none',
] as const
export type EmailActionType = (typeof EMAIL_ACTION_TYPES)[number]

export const EMAIL_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const
export type EmailPriority = (typeof EMAIL_PRIORITIES)[number]

const suggestedActionSchema = z.object({
  type: z.enum(EMAIL_ACTION_TYPES),
  reason: z.string(),
  // Optional recipient / draft payload for reply or forward actions.
  to: z.string().optional(),
  draftSubject: z.string().optional(),
  draftBody: z.string().optional(),
})
export type SuggestedEmailAction = z.infer<typeof suggestedActionSchema>

const triageSchema = z.object({
  category: z.enum(EMAIL_CATEGORIES),
  intent: z.string(),
  summary: z.string(),
  priority: z.enum(EMAIL_PRIORITIES),
  suggestedActions: z.array(suggestedActionSchema).max(4),
  confidence: z.number().min(0).max(1),
})
export type EmailTriageResult = z.infer<typeof triageSchema>

export interface TriageContext {
  wedding: {
    brideFirstName: string
    groomFirstName: string
  }
  /** Whether the sender matches a known vendor for this wedding. */
  knownVendorName?: string
  /** Whether the sender matches a known guest for this wedding. */
  knownGuestName?: string
}

export interface TriageInput {
  fromAddress: string
  fromName?: string
  subject: string
  text?: string
  html?: string
  attachments: InboundAttachment[]
  context: TriageContext
}

const CONTRACT_HINTS = /\b(contract|agreement|invoice|deposit|proposal|quote|estimate)\b/i
const RSVP_HINTS = /\b(rsvp|attend|regrets|coming|plus one|dietary|allergy|allergies)\b/i
const QUESTION_HINTS = /\?|(\bwhat time\b|\bwhere\b|\bhow do\b|\bcan i\b|\bwill there\b)/i

/**
 * Deterministic fallback used when the AI gateway is unavailable or errors.
 * Intentionally conservative: proposes low-risk logging/forwarding only.
 */
export function heuristicTriage(input: TriageInput): EmailTriageResult {
  const haystack = `${input.subject}\n${input.text ?? ''}`.slice(0, 4000)
  const hasContractLikeAttachment = input.attachments.some((a) =>
    /pdf|msword|officedocument/i.test(a.contentType)
  )

  let category: EmailCategory = 'other'
  const actions: SuggestedEmailAction[] = []

  if (input.context.knownVendorName) {
    if (hasContractLikeAttachment || CONTRACT_HINTS.test(haystack)) {
      category = 'vendor_contract'
      actions.push({
        type: 'forward_to_couple',
        reason: 'Vendor sent a contract/quote-like document that needs the couple’s review.',
      })
    } else {
      category = 'vendor_general'
    }
    actions.push({ type: 'log_communication', reason: 'Record vendor correspondence.' })
  } else if (input.context.knownGuestName || RSVP_HINTS.test(haystack)) {
    if (RSVP_HINTS.test(haystack)) {
      category = 'guest_rsvp'
    } else if (QUESTION_HINTS.test(haystack)) {
      category = 'guest_question'
      actions.push({ type: 'flag_guest_question', reason: 'Guest asked a question to answer.' })
    } else {
      category = 'guest_question'
    }
  } else if (hasContractLikeAttachment || CONTRACT_HINTS.test(haystack)) {
    category = 'vendor_contract'
    actions.push({
      type: 'forward_to_couple',
      reason: 'Contains a document that looks like a contract, quote, or invoice.',
    })
  }

  if (actions.length === 0) {
    actions.push({ type: 'log_communication', reason: 'Keep a record of this message.' })
  }

  return {
    category,
    intent: input.subject,
    summary: (input.text ?? input.subject).slice(0, 240),
    priority: category === 'vendor_contract' ? 'high' : 'normal',
    suggestedActions: actions,
    confidence: 0.35,
  }
}

function buildPrompt(input: TriageInput): string {
  const { context } = input
  const attachmentList =
    input.attachments.length > 0
      ? input.attachments.map((a) => `- ${a.filename} (${a.contentType})`).join('\n')
      : '(none)'
  return [
    `You triage inbound email for the wedding of ${context.wedding.brideFirstName} & ${context.wedding.groomFirstName}.`,
    context.knownVendorName
      ? `The sender is a KNOWN VENDOR for this wedding: ${context.knownVendorName}.`
      : context.knownGuestName
        ? `The sender is a KNOWN GUEST for this wedding: ${context.knownGuestName}.`
        : 'The sender is not yet linked to a known vendor or guest.',
    '',
    `From: ${input.fromName ? `${input.fromName} <${input.fromAddress}>` : input.fromAddress}`,
    `Subject: ${input.subject}`,
    `Attachments:\n${attachmentList}`,
    '',
    'Body:',
    (input.text ?? '(no plain-text body)').slice(0, 6000),
    '',
    'Classify the message and propose the best next actions for the couple. Contracts,',
    'invoices, quotes, and agreements from vendors should be forwarded to the couple and',
    'flagged high priority. Guest questions should be flagged so the couple can answer.',
    'Only propose actions that clearly help; use "none" when no action is warranted.',
  ].join('\n')
}

/**
 * Run AI triage. Falls back to {@link heuristicTriage} when the gateway is
 * unconfigured or the model call fails, so the caller always gets a result.
 */
export async function triageEmail(input: TriageInput): Promise<EmailTriageResult> {
  if (!process.env.AI_GATEWAY_API_KEY) {
    return heuristicTriage(input)
  }

  try {
    const modelId = process.env.ETTA_MODEL || DEFAULT_MODEL
    const { object } = await generateObject({
      model: gateway(modelId),
      schema: triageSchema,
      prompt: buildPrompt(input),
    })
    return object
  } catch {
    return heuristicTriage(input)
  }
}
