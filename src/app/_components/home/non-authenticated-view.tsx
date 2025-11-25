import { SignInButton } from '~/app/_components/auth-buttons'

export default function NonAuthenticatedView() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="inline-block border-2 border-black p-2">
        <SignInButton />
      </div>
    </div>
  )
}
