import { redirect } from 'next/navigation'

import NamesForm from '~/app/_components/home/names-form'
import { api } from '~/trpc/server'

export default async function AuthenticatedView() {
  const currentUsersWedding = await api.wedding.getByUserId.query()
  if (currentUsersWedding) redirect('/dashboard')

  return <NamesForm />
}
