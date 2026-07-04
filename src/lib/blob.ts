import { del } from '@vercel/blob'
import { upload } from '@vercel/blob/client'

export type BlobUploadResult = {
  url: string
  pathname: string
  name: string
  size: number
}

/** True if a blob upload failed because a file with that name already exists. */
export function isDuplicateBlobError(error: unknown): boolean {
  return error instanceof Error && error.message.toLowerCase().includes('already exists')
}

/**
 * Upload files to Vercel Blob via client upload.
 *
 * Uploads run concurrently (Promise.allSettled) for better performance.
 * If any uploads fail, already-uploaded blobs are cleaned up to avoid orphans.
 */
export async function uploadFiles(files: File[]): Promise<BlobUploadResult[]> {
  if (files.length === 0) return []

  const results = await Promise.allSettled(
    files.map(async (file) => {
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/blob/upload',
      })
      return {
        url: blob.url,
        pathname: blob.pathname,
        name: file.name,
        size: file.size,
      }
    })
  )

  const fulfilled: BlobUploadResult[] = []
  const failed: string[] = []
  const duplicates: string[] = []

  for (const [i, result] of results.entries()) {
    if (result.status === 'fulfilled') {
      fulfilled.push(result.value)
    } else {
      const name = files[i]?.name ?? 'unknown'
      if (isDuplicateBlobError(result.reason)) {
        duplicates.push(name)
      } else {
        failed.push(name)
      }
    }
  }

  if (failed.length > 0 || duplicates.length > 0) {
    // Clean up already-uploaded blobs to avoid orphans
    if (fulfilled.length > 0) {
      try {
        await del(fulfilled.map((r) => r.url))
      } catch {
        // Best-effort cleanup — orphaned blobs are preferable to crashing here
      }
    }
    const messages = [
      duplicates.length > 0 ? `A file with the same name already exists: ${duplicates.join(', ')}` : null,
      failed.length > 0 ? `Failed to upload: ${failed.join(', ')}` : null,
    ].filter(Boolean)
    throw new Error(messages.join('. '))
  }

  return fulfilled
}
