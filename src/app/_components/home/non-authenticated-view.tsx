import { SignInButton } from '~/app/_components/auth-buttons'

export default function NonAuthenticatedView() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="inline-block rounded-lg border-2 p-4">
        <SignInButton />
      </div>
    </div>
  )
}
