import { AuthDebugWrapper } from './auth-debug-wrapper'

export default async function AuthPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <AuthDebugWrapper path={path} />
    </main>
  )
}
