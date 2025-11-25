import { redirect } from 'next/navigation'

import NamesForm from '~/app/_components/home/names-form'
import { api } from '~/trpc/server'

export default async function AuthenticatedView() {
  const currentUsersWebsite = await api.website.getByUserId.query()
  if (currentUsersWebsite) redirect('/dashboard')

  return <NamesForm />
}
