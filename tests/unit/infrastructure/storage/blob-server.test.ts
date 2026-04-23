/**
 * Tests for putServerBlob helper.
 */

jest.mock('~/env', () => ({ env: { BLOB_READ_WRITE_TOKEN: 'test-token' } }))
jest.mock('@vercel/blob', () => ({ put: jest.fn() }))

import { put } from '@vercel/blob'
import { putServerBlob } from '~/server/infrastructure/storage/blob-server'

const putMock = put as jest.MockedFunction<typeof put>

describe('putServerBlob', () => {
  beforeEach(() => {
    putMock.mockReset()
    putMock.mockResolvedValue({
      url: 'https://blob.example.com/foo-abc123.pdf',
      downloadUrl: 'https://blob.example.com/foo-abc123.pdf?download=1',
      pathname: 'foo-abc123.pdf',
      contentType: 'application/pdf',
      contentDisposition: 'inline',
    } as never)
  })

  it('uploads a Uint8Array body and maps the result', async () => {
    const body = new TextEncoder().encode('hello')

    const result = await putServerBlob({
      pathname: 'greetings/hello.txt',
      body,
      contentType: 'text/plain',
    })

    expect(putMock).toHaveBeenCalledTimes(1)
    expect(putMock).toHaveBeenCalledWith('greetings/hello.txt', body, {
      access: 'public',
      token: 'test-token',
      contentType: 'text/plain',
      addRandomSuffix: true,
    })
    expect(result).toEqual({
      url: 'https://blob.example.com/foo-abc123.pdf',
      pathname: 'foo-abc123.pdf',
      size: 5,
      contentType: 'text/plain',
    })
  })

  it('uses Buffer.length for Buffer bodies', async () => {
    const buf = Buffer.from('hello world')

    const result = await putServerBlob({
      pathname: 'x.bin',
      body: buf,
      contentType: 'application/octet-stream',
    })

    expect(result.size).toBe(buf.length)
    expect(result.size).toBe(11)
  })

  it('uses byteLength for ArrayBuffer bodies', async () => {
    const ab = new ArrayBuffer(42)

    const result = await putServerBlob({
      pathname: 'x.bin',
      body: ab,
      contentType: 'application/octet-stream',
    })

    expect(result.size).toBe(42)
  })

  it('passes the contentType argument through to put()', async () => {
    const body = new TextEncoder().encode('data')

    await putServerBlob({
      pathname: 'doc.pdf',
      body,
      contentType: 'application/pdf',
    })

    expect(putMock.mock.calls[0][2]).toMatchObject({ contentType: 'application/pdf' })
  })
})

describe('putServerBlob without token', () => {
  it('throws a clear error if BLOB_READ_WRITE_TOKEN is not configured', async () => {
    jest.resetModules()
    await jest.isolateModulesAsync(async () => {
      jest.doMock('~/env', () => ({ env: { BLOB_READ_WRITE_TOKEN: undefined } }), {
        virtual: false,
      })
      jest.doMock('@vercel/blob', () => ({ put: jest.fn() }))

      const mod = await import('~/server/infrastructure/storage/blob-server')

      await expect(
        mod.putServerBlob({
          pathname: 'x.txt',
          body: new TextEncoder().encode('x'),
          contentType: 'text/plain',
        })
      ).rejects.toThrow('BLOB_READ_WRITE_TOKEN is not configured')
    })
  })
})
