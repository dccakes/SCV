import DashboardTopbar from '@/components/dashboard/dashboard-topbar'
import { PendingSuggestionsFeed } from '~/components/etta/PendingSuggestionsFeed'
import { api } from '~/trpc/server'

export const dynamic = 'force-dynamic'

export default async function EttaPendingPage() {
  const suggestions = (await api.etta.getAll({})) ?? []

  return (
    <>
      <DashboardTopbar title='Etta Inbox' showManagementActions={false} />
      <main className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
        <PendingSuggestionsFeed suggestions={suggestions} />
      </main>
    </>
  )
}
