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

export type PartitionedUploadResults<T> = {
  fulfilled: T[]
  duplicates: string[]
  failed: string[]
}

/** Split settled per-file upload results into successes, name collisions, and other failures. */
export function partitionUploadResults<T>(
  fileNames: string[],
  results: PromiseSettledResult<T>[]
): PartitionedUploadResults<T> {
  const fulfilled: T[] = []
  const duplicates: string[] = []
  const failed: string[] = []

  for (const [i, result] of results.entries()) {
    if (result.status === 'fulfilled') {
      fulfilled.push(result.value)
    } else {
      const name = fileNames[i] ?? 'unknown'
      if (isDuplicateBlobError(result.reason)) {
        duplicates.push(name)
      } else {
        failed.push(name)
      }
    }
  }

  return { fulfilled, duplicates, failed }
}

/** Build a single human-readable error message from upload name collisions and failures. */
export function describeUploadFailures(duplicates: string[], failed: string[]): string {
  return [
    duplicates.length > 0
      ? `A file with the same name already exists: ${duplicates.join(', ')}`
      : null,
    failed.length > 0 ? `Failed to upload: ${failed.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join('. ')
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

  const { fulfilled, duplicates, failed } = partitionUploadResults(
    files.map((f) => f.name),
    results
  )

  if (failed.length > 0 || duplicates.length > 0) {
    // Clean up already-uploaded blobs to avoid orphans
    if (fulfilled.length > 0) {
      try {
        await del(fulfilled.map((r) => r.url))
      } catch {
        // Best-effort cleanup — orphaned blobs are preferable to crashing here
      }
    }
    throw new Error(describeUploadFailures(duplicates, failed))
  }

  return fulfilled
}
