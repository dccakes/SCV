jest.mock('@vercel/blob', () => ({
  del: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('@vercel/blob/client', () => ({
  upload: jest.fn(),
}))

import { del } from '@vercel/blob'
import { upload } from '@vercel/blob/client'

import { uploadFiles } from '~/lib/blob'

const mockUpload = upload as jest.Mock
const mockDel = del as jest.Mock

function createMockFile(name: string, size = 1024): File {
  return new File(['x'.repeat(size)], name, { type: 'application/pdf' })
}

describe('uploadFiles', () => {
  beforeEach(() => {
    mockUpload.mockReset()
    mockDel.mockReset()
  })

  it('should return empty array for empty input', async () => {
    const result = await uploadFiles([])
    expect(result).toEqual([])
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('should upload files concurrently and return results', async () => {
    mockUpload.mockResolvedValue({
      url: 'https://abc.public.blob.vercel-storage.com/file.pdf',
      pathname: 'file.pdf',
    })

    const files = [createMockFile('file1.pdf'), createMockFile('file2.pdf')]
    const results = await uploadFiles(files)

    expect(results).toHaveLength(2)
    expect(mockUpload).toHaveBeenCalledTimes(2)
    expect(results[0]).toMatchObject({ name: 'file1.pdf' })
    expect(results[1]).toMatchObject({ name: 'file2.pdf' })
  })

  it('should clean up uploaded blobs when one upload fails', async () => {
    mockUpload
      .mockResolvedValueOnce({
        url: 'https://abc.public.blob.vercel-storage.com/file1.pdf',
        pathname: 'file1.pdf',
      })
      .mockRejectedValueOnce(new Error('Upload failed'))

    const files = [createMockFile('file1.pdf'), createMockFile('file2.pdf')]

    await expect(uploadFiles(files)).rejects.toThrow('Failed to upload: file2.pdf')
    expect(mockDel).toHaveBeenCalledWith(['https://abc.public.blob.vercel-storage.com/file1.pdf'])
  })

  it('should not crash when cleanup fails', async () => {
    mockUpload
      .mockResolvedValueOnce({
        url: 'https://abc.public.blob.vercel-storage.com/file1.pdf',
        pathname: 'file1.pdf',
      })
      .mockRejectedValueOnce(new Error('Upload failed'))
    mockDel.mockRejectedValue(new Error('Cleanup failed'))

    const files = [createMockFile('file1.pdf'), createMockFile('file2.pdf')]

    await expect(uploadFiles(files)).rejects.toThrow('Failed to upload: file2.pdf')
  })

  it('should pass correct options to upload', async () => {
    mockUpload.mockResolvedValue({
      url: 'https://abc.public.blob.vercel-storage.com/test.pdf',
      pathname: 'test.pdf',
    })

    const file = createMockFile('test.pdf')
    await uploadFiles([file])

    expect(mockUpload).toHaveBeenCalledWith('test.pdf', file, {
      access: 'public',
      handleUploadUrl: '/api/blob/upload',
    })
  })
})
