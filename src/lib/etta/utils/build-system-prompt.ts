import type { EttaContext } from '~/lib/etta/types'

export function buildSystemPrompt(ctx: EttaContext): string {
  const { brideFirstName: bride, groomFirstName: groom } = ctx.wedding

  if (ctx.actor === 'couple') {
    return buildPlannerPrompt(bride, groom, ctx)
  }

  return buildConciergePrompt(bride, groom)
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
