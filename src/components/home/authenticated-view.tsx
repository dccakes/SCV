import { redirect } from 'next/navigation'

import NamesForm from '~/components/home/names-form'
import { api } from '~/trpc/server'

export default async function AuthenticatedView() {
  const currentUsersWedding = await api.wedding.getByUserId()
  if (currentUsersWedding) redirect('/dashboard')

  return <NamesForm />
}
