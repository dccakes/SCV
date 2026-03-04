import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Dashboard from '@/app/_components/old_dashboard'
import { env } from '~/env'
import { api } from '~/trpc/server'

// Check if S3 is configured
const isS3Enabled = !!(
  env.AWS_S3_BUCKET_NAME &&
  env.AWS_S3_REGION &&
  env.AWS_S3_ACCESS_KEY_ID &&
  env.AWS_S3_SECRET_ACCESS_KEY
)

const Bucket = env.AWS_S3_BUCKET_NAME
const region = env.AWS_S3_REGION

// Only initialize S3 client if configured
const s3 = isS3Enabled
  ? new S3Client({
      region,
      credentials: {
        accessKeyId: env.AWS_S3_ACCESS_KEY_ID ?? '',
        secretAccessKey: env.AWS_S3_SECRET_ACCESS_KEY ?? '',
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
    .then(async () => {
      const photoName = files[0]?.name
      const objectUrl = `https://${Bucket}.s3.${region}.amazonaws.com/${photoName}`
      await api.website.updateCoverPhoto.mutate({
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
        await api.website.updateCoverPhoto.mutate({
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
  headers() // Make this page dynamic (requires authentication)

  const dashboardData = await api.dashboard.getByUserId.query()

  if (dashboardData === null) {
    redirect('/')
  }

  return (
    <Dashboard dashboardData={dashboardData} uploadImage={uploadImage} deleteImage={deleteImage} />
  )
}
