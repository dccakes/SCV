import { AuthView } from '@daveyplate/better-auth-ui'

export default async function AuthPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params
  const isSignInPath = path === 'sign-in'

  return (
    <main className='flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8'>
      <div className='w-full max-w-md space-y-4'>
        <AuthView path={path} />

        {isSignInPath ? (
          <section className='rounded-md border border-border bg-card p-3 text-card-foreground shadow-sm'>
            <h2 className='font-medium text-sm'>Demo Accounts</h2>
            <p className='mt-1 text-muted-foreground text-xs'>
              Try the seeded wedding demo data with one of these accounts.
            </p>
            <ul className='mt-2 list-disc space-y-1 pl-5 text-xs'>
              <li>
                <span className='font-medium'>shrek@swamp.wed</span>
              </li>
              <li>
                <span className='font-medium'>fiona@swamp.wed</span>
              </li>
              <li>
                <span className='font-medium'>queen.lillian@swamp.wed</span>
              </li>
            </ul>
            <p className='mt-2 text-xs'>Password: password123</p>
          </section>
        ) : null}
      </div>
    </main>
  )
}
