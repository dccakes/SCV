import { Skeleton } from '~/components/ui/skeleton'

export default function DashboardSkeleton() {
  return (
    <div className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
      <div className='flex flex-col gap-5'>
        {/* Countdown hero skeleton */}
        <div className='relative overflow-hidden rounded-lg bg-sidebar-ink px-6 py-5'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <Skeleton className='mb-2 h-3 w-32 bg-sidebar-cream/10' />
              <Skeleton className='mb-1 h-7 w-48 bg-sidebar-cream/10' />
              <Skeleton className='h-3 w-56 bg-sidebar-cream/10' />
            </div>
            <div className='flex items-end gap-3'>
              <Skeleton className='h-16 w-14 bg-sidebar-cream/10' />
              <Skeleton className='h-16 w-14 bg-sidebar-cream/10' />
              <Skeleton className='h-16 w-14 bg-sidebar-cream/10' />
            </div>
          </div>
        </div>

        {/* Mini stats skeleton */}
        <div className='grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border/90 bg-border lg:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='flex items-center gap-3 bg-card/90 px-4 py-3'>
              <Skeleton className='h-6 w-6 rounded-full' />
              <div>
                <Skeleton className='mb-1 h-5 w-10' />
                <Skeleton className='h-2.5 w-16' />
              </div>
            </div>
          ))}
        </div>

        {/* Row: RSVP + Tasks skeleton */}
        <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
          <div className='overflow-hidden rounded-lg border border-border/90 bg-card/85'>
            <div className='border-border border-b px-4 py-3'>
              <Skeleton className='h-3 w-20' />
            </div>
            <div className='p-4'>
              <div className='mb-3 grid grid-cols-4 gap-2'>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className='text-center'>
                    <Skeleton className='mx-auto mb-1 h-8 w-10' />
                    <Skeleton className='mx-auto h-2.5 w-12' />
                  </div>
                ))}
              </div>
              <Skeleton className='mb-3 h-1.5 w-full rounded-full' />
              <Skeleton className='h-10 w-32' />
            </div>
          </div>
          <div className='overflow-hidden rounded-lg border border-border/90 bg-card/85'>
            <div className='border-border border-b px-4 py-3'>
              <Skeleton className='h-3 w-24' />
            </div>
            <div className='p-4'>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className='mb-2 flex items-center gap-2'>
                  <Skeleton className='h-5 w-5 rounded' />
                  <Skeleton className='h-4 flex-1' />
                  <Skeleton className='h-4 w-12' />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row: Budget + Vendors + Milestones skeleton */}
        <div className='grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='overflow-hidden rounded-lg border border-border/90 bg-card/85'>
              <div className='border-border border-b px-4 py-3'>
                <Skeleton className='h-3 w-16' />
              </div>
              <div className='p-4'>
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className='mb-2 flex items-center gap-2'>
                    <Skeleton className='h-4 w-4 rounded-full' />
                    <Skeleton className='h-4 flex-1' />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
