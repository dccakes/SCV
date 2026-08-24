import { Skeleton } from '~/components/ui/skeleton'

export default function BudgetLoading() {
  return (
    <>
      {/* Topbar skeleton — matches DashboardTopbar h-14 */}
      <div className='flex h-14 flex-shrink-0 items-center justify-between border-border/80 border-b bg-card/70 px-4 lg:px-6'>
        <div className='flex items-center gap-3'>
          <Skeleton className='h-8 w-8 lg:hidden' />
          <Skeleton className='h-5 w-16' />
        </div>
        <Skeleton className='h-8 w-8' />
      </div>

      <main className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
        {/* BudgetSummary skeleton — Overview heading + settings button + stat tiles */}
        <section className='mb-8'>
          <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
            <Skeleton className='h-5 w-20' />
            <Skeleton className='h-8 w-28' />
          </div>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {['a', 'b', 'c', 'd'].map((id) => (
              <div
                key={`budget-stat-loading-${id}`}
                className='rounded-lg border border-border/70 bg-card p-4'
              >
                <Skeleton className='h-3 w-24' />
                <Skeleton className='mt-2 h-8 w-28' />
              </div>
            ))}
          </div>
        </section>

        {/* Category card skeletons — collapsed header row */}
        <div className='space-y-4'>
          {['a', 'b', 'c'].map((id) => (
            <div
              key={`budget-category-loading-${id}`}
              className='rounded-lg border border-border/70 bg-card'
            >
              <div className='flex items-center gap-3 p-4 md:p-5'>
                <Skeleton className='h-4 w-4 shrink-0' />
                <Skeleton className='h-5 flex-1' />
                <div className='flex shrink-0 items-center gap-5 sm:gap-8'>
                  <Skeleton className='h-8 w-14' />
                  <Skeleton className='h-8 w-14' />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
