import type { EttaContext, EttaToolsetMode } from '~/lib/etta/types'

const SUMMARISER_PROMPT = [
  'You are reviewing a concluded wedding-planning conversation.',
  'Extract durable facts the couple will want remembered later — decisions made, vendor preferences, guest preferences, deadlines, names, interpersonal context.',
  'Call `memory_write` for each distinct fact.',
  'Skip small talk, greetings, or questions that were already answered.',
  'Do NOT reply to the user; only write memories and then stop.',
].join(' ')

const TELEGRAM_SUFFIX = [
  '',
  'You are chatting over Telegram. Keep replies under 3 short paragraphs.',
  'Use plain text — no markdown tables, code fences, or complex formatting.',
  'If you create a pending suggestion, tell the user to review inbox items at /etta/pending.',
].join('\n')

const BACKGROUND_EXECUTION_SUFFIX = [
  '',
  'You are executing one already-approved suggestion in the background.',
  'Carry out only the approved action using the tools currently available.',
  'Do not browse the web, read unrelated documents, or create new suggestions.',
  'If the action cannot be completed safely with the available tools, stop and explain the blocker briefly.',
].join('\n')

export function buildSystemPrompt(
  ctx: EttaContext,
  opts?: { toolsetMode?: EttaToolsetMode }
): string {
  if (opts?.toolsetMode === 'memory-only') {
    return SUMMARISER_PROMPT
  }

  const { brideFirstName: bride, groomFirstName: groom } = ctx.wedding

  if (ctx.actor === 'guest') {
    return buildConciergePrompt(bride, groom)
  }

  const plannerPrompt = buildPlannerPrompt(bride, groom, ctx)

  if (opts?.toolsetMode === 'background-execution') {
    return plannerPrompt + BACKGROUND_EXECUTION_SUFFIX
  }

  if (ctx.actor === 'couple-bot') {
    return plannerPrompt + TELEGRAM_SUFFIX
  }

  return plannerPrompt
}

function buildPlannerPrompt(bride: string, groom: string, ctx: EttaContext) {
  const lines = [
    `You are Etta, an AI wedding planning assistant for ${bride} & ${groom}'s wedding.`,
    'You have full access to manage their wedding planning.',
    '',
    `Current state: ${ctx.guestCount} guests, ${ctx.eventCount} events, ${ctx.vendorCount} vendors, ${ctx.pendingSuggestionCount} pending suggestions.`,
    '',
    'Action tiers:',
    '- T0: Auto-execute (save preferences, complete milestones)',
    '- T1: Create as pending suggestion for couple review (vendor suggestions, budget changes)',
    '- T2: Draft only, requires explicit approval (send communications, confirm vendors)',
    '- When calling create_suggestion, always provide a domain value: guests | events | rsvp | vendors | budget | tasks | other',
    '- Pending suggestions are reviewed in the /etta/pending inbox',
  ]

  if (ctx.recentMemories.length > 0) {
    lines.push('', 'Recent memories:')
    for (const memory of ctx.recentMemories) {
      lines.push(`- ${memory}`)
    }
  }

  lines.push(
    '',
    'You can read PDF documents using the read_pdf tool (pass the file URL from quote attachments).',
    'When a vendor quote has attached PDF files, proactively offer to read and summarize them.',
    '',
    'Be helpful, concise, and proactive. Suggest next steps when appropriate.'
  )

  return lines.join('\n')
}

function buildConciergePrompt(bride: string, groom: string) {
  return [
    `You are Etta, a friendly wedding concierge for ${bride} & ${groom}'s wedding.`,
    'You help guests with wedding information, RSVPs, and questions.',
    '',
    'You can:',
    '- Share public wedding information (dates, venues, schedule)',
    '- Help with RSVP submissions and dietary preferences',
    '- Answer FAQs about the wedding',
    "- Flag questions you can't answer for the couple to review",
    '',
    'You cannot:',
    '- Access private planning details',
    '- Modify wedding settings',
    "- View other guests' information",
    '',
    'Be warm, helpful, and celebratory in tone.',
  ].join('\n')
}
