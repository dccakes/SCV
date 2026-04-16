import { redirect } from 'next/navigation'

type SearchParamValue = string | string[] | undefined

const CANONICAL_SIGN_IN_PATH = '/auth/sign-in'
const ALLOWED_HANDOFF_PARAMS = ['redirectTo', 'callbackUrl'] as const

export default async function SignInPage(props: {
  searchParams?: Promise<Record<string, SearchParamValue>>
}) {
  const resolvedSearchParams = (await props.searchParams) ?? {}
  const nextSearchParams = new URLSearchParams()

  ALLOWED_HANDOFF_PARAMS.forEach((key) => {
    const value = resolvedSearchParams[key]
    if (typeof value === 'string') {
      nextSearchParams.set(key, value)
      return
    }

    if (Array.isArray(value) && value[0]) {
      nextSearchParams.set(key, value[0])
    }
  })

  const queryString = nextSearchParams.toString()
  const destination =
    queryString.length > 0 ? `${CANONICAL_SIGN_IN_PATH}?${queryString}` : CANONICAL_SIGN_IN_PATH
  redirect(destination)
}
