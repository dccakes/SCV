import { upload } from '@vercel/blob/client'

export type BlobUploadResult = {
  url: string
  pathname: string
  name: string
  size: number
}

/**
 * Upload files to Vercel Blob via client upload.
 */
export async function uploadFiles(files: File[]): Promise<BlobUploadResult[]> {
  const results: BlobUploadResult[] = []

  for (const file of files) {
    const blob = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: '/api/blob/upload',
    })

    results.push({
      url: blob.url,
      pathname: blob.pathname,
      name: file.name,
      size: file.size,
    })
  }

  return results
}
