import { redirect } from 'next/navigation'

type SearchParamValue = string | string[] | undefined

const appendSearchParam = (params: URLSearchParams, key: string, value: SearchParamValue): void => {
  if (typeof value === 'string') {
    params.append(key, value)
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item) => {
      params.append(key, item)
    })
  }
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, SearchParamValue>>
} = {}) {
  const resolvedSearchParams = (await searchParams) ?? {}
  const nextSearchParams = new URLSearchParams()

  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    appendSearchParam(nextSearchParams, key, value)
  })

  const queryString = nextSearchParams.toString()
  const destination = queryString.length > 0 ? `/auth/sign-in?${queryString}` : '/auth/sign-in'
  redirect(destination)
}
