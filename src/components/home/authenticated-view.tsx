import { redirect } from 'next/navigation'

import NamesForm from '~/components/home/names-form'
import { api } from '~/trpc/server'

export default async function AuthenticatedView({
  activeWeddingId,
}: {
  activeWeddingId: string | null
}) {
  if (activeWeddingId) redirect('/dashboard')

  const hasWedding = await api.wedding.hasWedding()
  if (hasWedding) redirect('/dashboard')

  return <NamesForm />
}
