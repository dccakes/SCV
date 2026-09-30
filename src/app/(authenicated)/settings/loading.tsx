import { Skeleton } from '~/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <>
      {/* Topbar skeleton — mirrors DashboardTopbar h-14 with showManagementActions=false */}
      <div className='flex h-14 flex-shrink-0 items-center justify-between border-border/80 border-b bg-card/70 px-4 lg:px-6'>
        <div className='flex items-center gap-3'>
          <Skeleton className='h-11 w-11 lg:hidden' />
          <Skeleton className='h-5 w-20' />
        </div>
        <Skeleton className='h-8 w-8' />
      </div>

      {/* Content area — matches page wrapper */}
      <div className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
        <div className='mx-auto max-w-2xl space-y-6'>
          {/* Wedding Details heading */}
          <div className='mb-6'>
            <Skeleton className='h-6 w-40' />
            <Skeleton className='mt-2 h-3.5 w-80' />
          </div>

          {/* Couple name cards — 2-col grid matching md:grid-cols-2 */}
          <div className='grid gap-6 md:grid-cols-2'>
            {['groom', 'bride'].map((person) => (
              <div
                key={person}
                className='space-y-4 rounded-lg border border-border/90 bg-card/85 p-5'
              >
                <Skeleton className='h-3 w-12' />
                <div className='space-y-2'>
                  <Skeleton className='h-3.5 w-20' />
                  <Skeleton className='h-9 w-full rounded-md' />
                </div>
                <div className='space-y-2'>
                  <Skeleton className='h-3.5 w-20' />
                  <Skeleton className='h-9 w-full rounded-md' />
                </div>
              </div>
            ))}
          </div>

          {/* Ceremony Event card — matches rounded-lg border bg-card/85 p-5 */}
          <div className='rounded-lg border border-border/90 bg-card/85 p-5'>
            <Skeleton className='mb-4 h-3 w-28' />
            <div className='space-y-4'>
              <div className='grid gap-3 sm:grid-cols-2'>
                <div className='rounded-md border border-border/70 bg-muted/20 p-3'>
                  <Skeleton className='mb-1 h-3 w-10' />
                  <Skeleton className='h-4 w-32' />
                </div>
                <div className='rounded-md border border-border/70 bg-muted/20 p-3'>
                  <Skeleton className='mb-1 h-3 w-16' />
                  <Skeleton className='h-4 w-28' />
                </div>
              </div>
              <Skeleton className='h-4 w-64' />
              <Skeleton className='h-9 w-44 rounded-md' />
            </div>
          </div>

          {/* Save Changes button — full width */}
          <Skeleton className='h-9 w-full rounded-md' />

          {/* Plugins section */}
          <div className='space-y-3'>
            <div>
              <Skeleton className='h-6 w-16' />
              <Skeleton className='mt-2 h-3.5 w-72' />
            </div>
            <div className='rounded-lg border border-border/80 bg-card/80 px-6 py-5'>
              <div className='flex items-start justify-between gap-4'>
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-3 w-36' />
                  <Skeleton className='h-5 w-52' />
                  <Skeleton className='h-4 w-full max-w-sm' />
                  <Skeleton className='h-4 w-56' />
                </div>
                <Skeleton className='h-5 w-9 shrink-0 rounded-full' />
              </div>
            </div>
          </div>

          {/* Organization Members section */}
          <div className='space-y-3'>
            <div>
              <Skeleton className='h-6 w-48' />
              <Skeleton className='mt-2 h-3.5 w-80' />
            </div>
            <div className='space-y-4 rounded-lg border border-border/80 bg-card/80 p-6'>
              <div className='flex items-center justify-between'>
                <Skeleton className='h-5 w-28' />
                <Skeleton className='h-8 w-24 rounded-md' />
              </div>
              {[1, 2].map((i) => (
                <div key={`member-${i}`} className='flex items-center gap-3'>
                  <Skeleton className='h-8 w-8 shrink-0 rounded-full' />
                  <div className='flex-1 space-y-1.5'>
                    <Skeleton className='h-4 w-36' />
                    <Skeleton className='h-3 w-24' />
                  </div>
                  <Skeleton className='h-5 w-14 rounded' />
                </div>
              ))}
            </div>
          </div>

          {/* Connected Apps section */}
          <div className='space-y-3'>
            <div>
              <Skeleton className='h-6 w-36' />
              <Skeleton className='mt-2 h-3.5 w-56' />
            </div>
            <div className='rounded-lg border border-border/80 bg-card/80 p-6'>
              <div className='flex items-start gap-3'>
                <Skeleton className='h-10 w-10 shrink-0 rounded-md' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-5 w-28' />
                  <Skeleton className='h-4 w-full max-w-xs' />
                  <Skeleton className='mt-2 h-8 w-32 rounded-md' />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
