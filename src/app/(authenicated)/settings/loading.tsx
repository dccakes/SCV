import { Skeleton } from '~/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <>
      {/* Topbar skeleton — matches DashboardTopbar h-14 with no management actions */}
      <div className='flex h-14 flex-shrink-0 items-center border-border/80 border-b bg-card/70 px-4 lg:px-6'>
        <div className='flex items-center gap-3'>
          <Skeleton className='h-8 w-8 lg:hidden' />
          <Skeleton className='h-5 w-16' />
        </div>
      </div>

      <div className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
        <div className='mx-auto max-w-2xl space-y-6'>
          {/* Wedding Details section */}
          <div className='mb-2'>
            <Skeleton className='h-6 w-36' />
            <Skeleton className='mt-1.5 h-3 w-72' />
          </div>
          <div className='space-y-4 rounded-lg border border-border/70 bg-card p-5'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <Skeleton className='h-3 w-20' />
                <Skeleton className='h-9 w-full' />
              </div>
              <div className='space-y-1.5'>
                <Skeleton className='h-3 w-20' />
                <Skeleton className='h-9 w-full' />
              </div>
              <div className='space-y-1.5'>
                <Skeleton className='h-3 w-20' />
                <Skeleton className='h-9 w-full' />
              </div>
              <div className='space-y-1.5'>
                <Skeleton className='h-3 w-20' />
                <Skeleton className='h-9 w-full' />
              </div>
            </div>
            <Skeleton className='h-9 w-28' />
          </div>

          {/* Plugins section */}
          <div className='space-y-3'>
            <div>
              <Skeleton className='h-6 w-16' />
              <Skeleton className='mt-1.5 h-3 w-64' />
            </div>
            <div className='rounded-lg border border-border/70 bg-card p-4'>
              <div className='space-y-3'>
                {['a', 'b'].map((id) => (
                  <div key={`plugin-${id}`} className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <Skeleton className='h-4 w-32' />
                      <Skeleton className='h-3 w-48' />
                    </div>
                    <Skeleton className='h-5 w-9 rounded-full' />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Organization Members section */}
          <div className='space-y-3'>
            <div>
              <Skeleton className='h-6 w-44' />
              <Skeleton className='mt-1.5 h-3 w-64' />
            </div>
            {['a', 'b'].map((id) => (
              <div
                key={`member-card-${id}`}
                className='rounded-lg border border-border/70 bg-card p-4'
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Skeleton className='h-8 w-8 rounded-full' />
                    <div className='space-y-1'>
                      <Skeleton className='h-4 w-32' />
                      <Skeleton className='h-3 w-24' />
                    </div>
                  </div>
                  <Skeleton className='h-6 w-16 rounded-full' />
                </div>
              </div>
            ))}
          </div>

          {/* Connected Apps section */}
          <div className='space-y-3'>
            <div>
              <Skeleton className='h-6 w-32' />
              <Skeleton className='mt-1.5 h-3 w-40' />
            </div>
            <div className='rounded-lg border border-border/70 bg-card p-4'>
              <div className='flex items-center justify-between'>
                <div className='space-y-1'>
                  <Skeleton className='h-4 w-28' />
                  <Skeleton className='h-3 w-48' />
                </div>
                <Skeleton className='h-8 w-24' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
