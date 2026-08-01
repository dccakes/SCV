import { Skeleton } from '~/components/ui/skeleton'

export default function WebsiteLoading() {
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

      {/* Content area — matches page wrapper div */}
      <div className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
        <div className='mx-auto max-w-2xl space-y-6'>
          {/* Page header */}
          <div className='mb-2'>
            <Skeleton className='h-7 w-44' />
            <Skeleton className='mt-1.5 h-3 w-64' />
          </div>

          {/* WebsiteManager card — published state */}
          <div className='rounded-md border border-border/70 bg-card p-5'>
            <Skeleton className='h-5 w-24 rounded-full' />
            <Skeleton className='mt-3 h-4 w-full' />
            <Skeleton className='mt-1.5 h-4 w-4/5' />
            <div className='mt-4 flex flex-wrap items-center gap-2'>
              <Skeleton className='h-9 flex-1' />
              <Skeleton className='h-9 w-24' />
              <Skeleton className='h-9 w-24' />
            </div>
          </div>

          {/* Password protection card */}
          <div className='space-y-3 rounded-lg border border-border/80 bg-card/80 p-6'>
            <Skeleton className='h-2.5 w-12' />
            <div className='flex items-center gap-2'>
              <Skeleton className='h-5 w-5 shrink-0' />
              <Skeleton className='h-7 w-48' />
            </div>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-4/5' />
            <div className='mt-1 flex items-center justify-between'>
              <Skeleton className='h-4 w-36' />
              <Skeleton className='h-6 w-11 rounded-full' />
            </div>
          </div>

          {/* RSVP toggle card */}
          <div className='space-y-3 rounded-lg border border-border/80 bg-card/80 p-6'>
            <Skeleton className='h-2.5 w-24' />
            <div className='flex items-center gap-2'>
              <Skeleton className='h-5 w-5 shrink-0' />
              <Skeleton className='h-7 w-36' />
            </div>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-3/4' />
            <div className='mt-1 flex items-center justify-between'>
              <Skeleton className='h-4 w-40' />
              <Skeleton className='h-6 w-11 rounded-full' />
            </div>
          </div>

          {/* Template picker card */}
          <div className='space-y-3 rounded-lg border border-border/80 bg-card/80 p-6'>
            <Skeleton className='h-2.5 w-16' />
            <Skeleton className='h-7 w-40' />
            <Skeleton className='h-4 w-full' />
            <div className='mt-2 grid grid-cols-3 gap-3'>
              {['t1', 't2', 't3'].map((tid) => (
                <Skeleton key={`tmpl-${tid}`} className='h-24 rounded-lg' />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
