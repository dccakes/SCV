import { AuthView } from '@daveyplate/better-auth-ui'

export default async function AuthPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <AuthView path={path} />
    </main>
  )
}
