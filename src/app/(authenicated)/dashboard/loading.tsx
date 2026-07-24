import { Skeleton } from '~/components/ui/skeleton'

export default function DashboardSkeleton() {
  return (
    <>
      {/* Topbar skeleton — matches DashboardTopbar h-14 */}
      <div className='flex h-14 flex-shrink-0 items-center justify-between border-border/80 border-b bg-card/70 px-4 lg:px-6'>
        <Skeleton className='h-5 w-28' />
        <Skeleton className='h-8 w-20' />
      </div>

      {/* Content area — matches page wrapper padding */}
      <div className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
        <div className='flex flex-col gap-5'>
          {/* CountdownHero skeleton */}
          <Skeleton className='h-28 w-full rounded-lg' />

          {/* MiniStats skeleton — 2×2 on mobile, 4-col on desktop */}
          <div className='grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border/90 lg:grid-cols-4'>
            {[1, 2, 3, 4].map((i) => (
              <div key={`stat-${i}`} className='bg-card/90 px-4 py-3'>
                <Skeleton className='h-7 w-8' />
                <Skeleton className='mt-1.5 h-2.5 w-20' />
              </div>
            ))}
          </div>

          {/* RSVP + Tasks row — 2-col on md+ */}
          <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
            {[1, 2].map((i) => (
              <div
                key={`card-top-${i}`}
                className='overflow-hidden rounded-lg border border-border/90 bg-card/85'
              >
                <div className='flex items-center justify-between border-border border-b px-4 py-3'>
                  <Skeleton className='h-3 w-24' />
                  <Skeleton className='h-3 w-14' />
                </div>
                <div className='p-4'>
                  <Skeleton className='h-8 w-16' />
                  <Skeleton className='mt-2 h-1.5 w-full' />
                  <div className='mt-3 flex flex-col gap-2'>
                    {[1, 2, 3].map((j) => (
                      <Skeleton key={`row-${j}`} className='h-8 w-full' />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Budget + Vendors + Milestones row — 3-col on lg+ */}
          <div className='grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3'>
            {[1, 2, 3].map((i) => (
              <div
                key={`card-btm-${i}`}
                className='overflow-hidden rounded-lg border border-border/90 bg-card/85'
              >
                <div className='flex items-center justify-between border-border border-b px-4 py-3'>
                  <Skeleton className='h-3 w-16' />
                  <Skeleton className='h-3 w-12' />
                </div>
                <div className='p-4'>
                  <Skeleton className='h-8 w-24' />
                  <Skeleton className='mt-2 h-1.5 w-full' />
                  <div className='mt-3 grid grid-cols-3 gap-2'>
                    {[1, 2, 3].map((j) => (
                      <div key={`cell-${j}`} className='text-center'>
                        <Skeleton className='mx-auto h-6 w-8' />
                        <Skeleton className='mx-auto mt-1 h-2 w-12' />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
