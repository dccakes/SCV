import { Skeleton } from '~/components/ui/skeleton'

export default function WebsiteLoading() {
  return (
    <>
      {/* Topbar skeleton — matches DashboardTopbar h-14 with showManagementActions=false */}
      <div className='flex h-14 flex-shrink-0 items-center justify-between border-border/80 border-b bg-card/70 px-4 lg:px-6'>
        <div className='flex items-center gap-3'>
          <Skeleton className='h-8 w-8 lg:hidden' />
          <Skeleton className='h-5 w-16' />
        </div>
        <Skeleton className='h-8 w-8' />
      </div>

      {/* Content area — matches page wrapper and max-w-2xl constraint */}
      <div className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
        <div className='mx-auto max-w-2xl space-y-6'>
          {/* Page heading */}
          <div className='mb-2'>
            <Skeleton className='h-7 w-44' />
            <Skeleton className='mt-2 h-3 w-72' />
          </div>

          {/* WebsiteManager card — published URL + action buttons */}
          <div className='rounded-md border border-border/70 bg-card p-5'>
            <Skeleton className='h-5 w-24 rounded-full' />
            <Skeleton className='mt-3 h-4 w-full max-w-sm' />
            <Skeleton className='mt-1.5 h-4 w-3/4' />
            <div className='mt-4 flex flex-wrap items-center gap-2'>
              <Skeleton className='h-8 flex-1' />
              <Skeleton className='h-8 w-20' />
              <Skeleton className='h-8 w-24' />
            </div>
          </div>

          {/* Stacked card skeletons for password, RSVP toggle, template, editor sections */}
          {['password', 'rsvp', 'template', 'editor'].map((section) => (
            <div key={section} className='rounded-lg border border-border/70 bg-card/80 p-5'>
              <Skeleton className='h-3 w-28' />
              <Skeleton className='mt-3 h-6 w-52' />
              <Skeleton className='mt-2 h-4 w-full' />
              <Skeleton className='mt-1.5 h-4 w-4/5' />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
