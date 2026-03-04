import MePageContent from '~/app/(authenicated)/me/me-page-content'
import { api } from '~/trpc/server'

export default async function MePage() {
  const dashboardData = await api.dashboard.getByUserId.query()

  return <MePageContent dashboardData={dashboardData} />
}
