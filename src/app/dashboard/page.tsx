import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import Dashboard from '~/app/_components/dashboard'
import { sharedStyles } from '~/app/utils/shared-styles'
import { auth } from '~/lib/auth'
import { api } from '~/trpc/server'

// Check if S3 is configured
const isS3Enabled = !!(
  process.env.AWS_S3_BUCKET_NAME &&
  process.env.AWS_S3_REGION &&
  process.env.AWS_S3_ACCESS_KEY_ID &&
  process.env.AWS_S3_SECRET_ACCESS_KEY
)

const Bucket = process.env.AWS_S3_BUCKET_NAME
const region = process.env.AWS_S3_REGION

// Only initialize S3 client if configured
const s3 = isS3Enabled
  ? new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!,
      },
    })
  : null

const uploadImage = async (formData: FormData): Promise<{ ok: boolean }> => {
  'use server'

  if (!isS3Enabled || !s3) {
    return { ok: false }
  }

  const files = formData.getAll('file') as File[]
  const fileType = formData.get('type') as string

  return Promise.all(
    files.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer()
      const Body = Buffer.from(arrayBuffer)
      await s3.send(
        new PutObjectCommand({
          Bucket,
          Key: file.name,
          Body,
          ContentType: fileType,
          ContentEncoding: 'base64',
        })
      )
    })
  )
    .then(async (data) => {
      const session = await auth.api.getSession({
        headers: await headers(),
      })
      const photoName = files[0]!.name
      const objectUrl = `https://${Bucket}.s3.${region}.amazonaws.com/${photoName}`
      await api.website.updateCoverPhoto.mutate({
        userId: session?.user?.id,
        coverPhotoUrl: objectUrl,
      })
      return { ok: true }
    })
    .catch(() => {
      return { ok: false }
    })
}

const deleteImage = async (imageKey: string): Promise<{ ok: boolean }> => {
  'use server'

  if (!isS3Enabled || !s3) {
    return { ok: false }
  }

  return new Promise((resolve) => {
    s3.send(
      new DeleteObjectCommand({
        Bucket: Bucket,
        Key: imageKey,
      })
    )
      .then(async () => {
        const session = await auth.api.getSession({
          headers: await headers(),
        })
        await api.website.updateCoverPhoto.mutate({
          userId: session?.user?.id,
          coverPhotoUrl: null,
        })
        resolve({ ok: true })
      })
      .catch(() => {
        resolve({ ok: false })
      })
  })
}

export default async function DashboardPage() {
  const dashboardData = await api.dashboard.getByUserId.query()

  if (dashboardData === null) {
    redirect('/')
  }

  return (
    <main className={`${sharedStyles.desktopPaddingSides} ${sharedStyles.minPageWidth}`}>
      <Dashboard
        dashboardData={dashboardData}
        uploadImage={uploadImage}
        deleteImage={deleteImage}
      />
    </main>
  )
}
