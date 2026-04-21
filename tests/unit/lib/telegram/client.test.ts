/**
 * @jest-environment node
 */

import { createTelegramClient, TelegramClient } from '~/lib/telegram/client'

const TOKEN = 'test-bot-token'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function binaryResponse(
  buffer: ArrayBuffer,
  { status = 200, contentType = 'application/pdf' }: { status?: number; contentType?: string } = {}
): Response {
  return new Response(buffer, {
    status,
    headers: { 'content-type': contentType },
  })
}

describe('TelegramClient', () => {
  describe('sendMessage', () => {
    it('posts to /sendMessage with chat_id and text', async () => {
      const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ ok: true, result: {} }))
      const client = new TelegramClient(TOKEN, fetchMock as unknown as typeof fetch)

      await client.sendMessage(12345, 'hello world')

      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe(`https://api.telegram.org/bot${TOKEN}/sendMessage`)
      expect(init.method).toBe('POST')
      expect(init.headers).toMatchObject({ 'content-type': 'application/json' })
      expect(JSON.parse(init.body)).toEqual({ chat_id: 12345, text: 'hello world' })
    })

    it('includes parse_mode when parseMode option is set', async () => {
      const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ ok: true, result: {} }))
      const client = new TelegramClient(TOKEN, fetchMock as unknown as typeof fetch)

      await client.sendMessage('@channel', '*bold*', { parseMode: 'MarkdownV2' })

      const [, init] = fetchMock.mock.calls[0]
      expect(JSON.parse(init.body)).toEqual({
        chat_id: '@channel',
        text: '*bold*',
        parse_mode: 'MarkdownV2',
      })
    })

    it('throws with Telegram description when ok is false', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValue(jsonResponse({ ok: false, description: 'chat not found' }))
      const client = new TelegramClient(TOKEN, fetchMock as unknown as typeof fetch)

      await expect(client.sendMessage(1, 'hi')).rejects.toThrow(
        'Telegram API sendMessage: chat not found'
      )
    })
  })

  describe('sendChatAction', () => {
    it('posts to /sendChatAction with chat_id and action', async () => {
      const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ ok: true, result: true }))
      const client = new TelegramClient(TOKEN, fetchMock as unknown as typeof fetch)

      await client.sendChatAction(42, 'typing')

      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe(`https://api.telegram.org/bot${TOKEN}/sendChatAction`)
      expect(JSON.parse(init.body)).toEqual({ chat_id: 42, action: 'typing' })
    })
  })

  describe('getFile', () => {
    it('posts to /getFile and returns the result object', async () => {
      const result = { file_id: 'abc', file_path: 'documents/file.pdf', file_size: 100 }
      const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ ok: true, result }))
      const client = new TelegramClient(TOKEN, fetchMock as unknown as typeof fetch)

      const file = await client.getFile('abc')

      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe(`https://api.telegram.org/bot${TOKEN}/getFile`)
      expect(JSON.parse(init.body)).toEqual({ file_id: 'abc' })
      expect(file).toEqual(result)
    })
  })

  describe('downloadFile', () => {
    it('GETs the composed file URL and returns buffer + contentType', async () => {
      const payload = new TextEncoder().encode('file-body').buffer as ArrayBuffer
      const fetchMock = jest
        .fn()
        .mockResolvedValue(binaryResponse(payload, { contentType: 'application/pdf' }))
      const client = new TelegramClient(TOKEN, fetchMock as unknown as typeof fetch)

      const { buffer, contentType } = await client.downloadFile('documents/file.pdf')

      expect(fetchMock).toHaveBeenCalledWith(
        `https://api.telegram.org/file/bot${TOKEN}/documents/file.pdf`
      )
      expect(new TextDecoder().decode(buffer)).toBe('file-body')
      expect(contentType).toBe('application/pdf')
    })

    it('falls back to application/octet-stream when content-type header is missing', async () => {
      const payload = new TextEncoder().encode('x').buffer as ArrayBuffer
      // Build a response with no content-type header
      const response = new Response(payload, { status: 200 })
      // jsdom's Response auto-sets content-type; override by using headers.delete
      response.headers.delete('content-type')
      const fetchMock = jest.fn().mockResolvedValue(response)
      const client = new TelegramClient(TOKEN, fetchMock as unknown as typeof fetch)

      const { contentType } = await client.downloadFile('path/file.bin')
      expect(contentType).toBe('application/octet-stream')
    })

    it('throws when response status is >= 400', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValue(new Response('nope', { status: 404, headers: {} }))
      const client = new TelegramClient(TOKEN, fetchMock as unknown as typeof fetch)

      await expect(client.downloadFile('missing.pdf')).rejects.toThrow()
    })
  })

  describe('setWebhook', () => {
    it('posts to /setWebhook with url, secret_token, allowed_updates', async () => {
      const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ ok: true, result: true }))
      const client = new TelegramClient(TOKEN, fetchMock as unknown as typeof fetch)

      await client.setWebhook('https://example.com/api/webhooks/telegram', 'secret-123')

      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe(`https://api.telegram.org/bot${TOKEN}/setWebhook`)
      expect(JSON.parse(init.body)).toEqual({
        url: 'https://example.com/api/webhooks/telegram',
        secret_token: 'secret-123',
        allowed_updates: ['message'],
      })
    })
  })
})

describe('createTelegramClient', () => {
  it('throws when called with undefined token', () => {
    expect(() => createTelegramClient(undefined)).toThrow('TELEGRAM_BOT_TOKEN is not configured')
  })

  it('throws when called with empty string token', () => {
    expect(() => createTelegramClient('')).toThrow('TELEGRAM_BOT_TOKEN is not configured')
  })

  it('returns a TelegramClient when given a valid token', () => {
    const client = createTelegramClient('some-token')
    expect(client).toBeInstanceOf(TelegramClient)
  })
})
