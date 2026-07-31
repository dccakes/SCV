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

      {/* Content area — matches page wrapper padding */}
      <main className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
        {/* Overview section — matches BudgetSummary */}
        <div className='mb-8'>
          <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
            <div>
              <Skeleton className='h-6 w-24' />
              <Skeleton className='mt-1.5 h-3.5 w-64' />
            </div>
            <Skeleton className='h-8 w-28' />
          </div>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {['a', 'b', 'c', 'd'].map((id) => (
              <div key={`stat-${id}`} className='rounded-lg border border-border/70 bg-card p-4'>
                <Skeleton className='h-2.5 w-24' />
                <Skeleton className='mt-2 h-7 w-28' />
              </div>
            ))}
          </div>
        </div>

        {/* Allocation bar skeleton */}
        <div className='mb-8 rounded-lg border border-border/70 bg-card p-4'>
          <div className='mb-3 flex items-center justify-between'>
            <Skeleton className='h-2.5 w-28' />
            <Skeleton className='h-2.5 w-16' />
          </div>
          <Skeleton className='h-3 w-full rounded-full' />
          <div className='mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3'>
            {['a', 'b', 'c'].map((id) => (
              <div key={`legend-${id}`} className='flex items-center gap-2'>
                <Skeleton className='h-2.5 w-2.5 rounded-full' />
                <Skeleton className='h-3 flex-1' />
                <Skeleton className='h-3 w-8' />
              </div>
            ))}
          </div>
        </div>

        {/* Section count + controls row */}
        <div className='mb-4 flex items-center justify-between gap-3'>
          <Skeleton className='h-3 w-20' />
          <div className='flex items-center gap-2'>
            <Skeleton className='h-7 w-20' />
            <Skeleton className='h-8 w-24' />
          </div>
        </div>

        {/* Category card skeletons */}
        <div className='space-y-4'>
          {['a', 'b', 'c'].map((id) => (
            <div key={`cat-${id}`} className='rounded-lg border border-border/70 bg-card p-4'>
              <div className='flex items-start justify-between gap-2'>
                <Skeleton className='h-5 w-40' />
                <Skeleton className='h-5 w-16' />
              </div>
              <Skeleton className='mt-3 h-1.5 w-full rounded-full' />
              <div className='mt-3 flex justify-between'>
                <Skeleton className='h-3 w-24' />
                <Skeleton className='h-3 w-16' />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
