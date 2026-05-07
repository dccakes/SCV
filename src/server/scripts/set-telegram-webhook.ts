import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { createTelegramClient } from '~/lib/telegram/client'

const WEBHOOK_PATH = '/api/webhooks/telegram'

type ParsedArgs = {
  publicUrl: string
}

export const parseArgs = (argv: string[]): ParsedArgs => {
  const publicUrl = argv[0]?.trim()
  if (!publicUrl) {
    throw new Error('Usage: tsx src/server/scripts/set-telegram-webhook.ts <public-url>')
  }
  return { publicUrl: publicUrl.replace(/\/$/, '') }
}

const run = async (): Promise<void> => {
  const { publicUrl } = parseArgs(process.argv.slice(2))

  const token = process.env.TELEGRAM_BOT_TOKEN
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('TELEGRAM_WEBHOOK_SECRET is not configured')
  }

  const client = createTelegramClient(token)
  const webhookUrl = `${publicUrl}${WEBHOOK_PATH}`
  await client.setWebhook(webhookUrl, secret)

  process.stdout.write(`Telegram webhook registered: ${webhookUrl}\n`)
}

const entryFilePath = process.argv[1]
const moduleFilePath = fileURLToPath(import.meta.url)

if (entryFilePath && entryFilePath === moduleFilePath) {
  run().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(`Failed to set Telegram webhook: ${message}\n`)
    process.exit(1)
  })
}
