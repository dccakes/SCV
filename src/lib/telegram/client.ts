import type { TelegramFile } from '~/lib/telegram/types'

interface TelegramApiResponse<T> {
  ok: boolean
  result?: T
  description?: string
}

export class TelegramClient {
  constructor(
    private readonly token: string,
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  async sendMessage(
    chatId: number | string,
    text: string,
    opts?: { parseMode?: 'MarkdownV2' | 'HTML' }
  ): Promise<void> {
    const body: Record<string, unknown> = { chat_id: chatId, text }
    if (opts?.parseMode) {
      body.parse_mode = opts.parseMode
    }
    await this.callMethod('sendMessage', body)
  }

  async sendChatAction(
    chatId: number | string,
    action: 'typing' | 'upload_document'
  ): Promise<void> {
    await this.callMethod('sendChatAction', { chat_id: chatId, action })
  }

  async getFile(fileId: string): Promise<TelegramFile> {
    return this.callMethod<TelegramFile>('getFile', { file_id: fileId })
  }

  async downloadFile(filePath: string): Promise<{ buffer: ArrayBuffer; contentType: string }> {
    const url = `https://api.telegram.org/file/bot${this.token}/${filePath}`
    const response = await this.fetchImpl(url)
    if (response.status >= 400) {
      throw new Error(`Telegram file download failed: ${response.status} ${response.statusText}`)
    }
    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') ?? 'application/octet-stream'
    return { buffer, contentType }
  }

  async setWebhook(url: string, secretToken: string): Promise<void> {
    await this.callMethod('setWebhook', {
      url,
      secret_token: secretToken,
      allowed_updates: ['message'],
    })
  }

  private async callMethod<T>(method: string, body: Record<string, unknown>): Promise<T> {
    const response = await this.fetchImpl(`https://api.telegram.org/bot${this.token}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    const payload = (await response.json()) as TelegramApiResponse<T>
    if (!payload.ok) {
      throw new Error(`Telegram API ${method}: ${payload.description ?? 'unknown error'}`)
    }
    return payload.result as T
  }
}

export function createTelegramClient(token?: string): TelegramClient {
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured')
  return new TelegramClient(token)
}
