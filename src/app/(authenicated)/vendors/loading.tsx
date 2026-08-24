import { Skeleton } from '~/components/ui/skeleton'

export default function VendorsLoading() {
  return (
    <>
      <div className='flex h-14 flex-shrink-0 items-center justify-between border-border/80 border-b bg-card/70 px-4 lg:px-6'>
        <div className='flex items-center gap-3'>
          <Skeleton className='h-8 w-8 lg:hidden' />
          <Skeleton className='h-5 w-16' />
        </div>
        <Skeleton className='h-8 w-8' />
      </div>

      <main className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
        <div className='mb-6 flex items-center justify-between'>
          <Skeleton className='h-3.5 w-44' />
          <Skeleton className='h-8 w-24' />
        </div>

        {['cat-a', 'cat-b'].map((catId) => (
          <section key={catId} className='mb-8'>
            <div className='mb-3 flex items-center gap-3'>
              <Skeleton className='h-3 w-20' />
              <span className='h-px flex-1 bg-border' />
              <Skeleton className='h-7 w-32' />
              <Skeleton className='h-7 w-24' />
            </div>
            <div className='flex flex-col gap-2'>
              {['v1', 'v2', 'v3'].map((vendorId) => (
                <div
                  key={`${catId}-${vendorId}`}
                  className='flex items-center justify-between rounded-lg border border-border/90 bg-card/60 px-4 py-3'
                >
                  <div className='flex items-center gap-3'>
                    <div className='flex flex-col gap-1'>
                      <Skeleton className='h-4 w-32' />
                      <Skeleton className='h-3 w-20' />
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    <Skeleton className='h-5 w-20' />
                    <Skeleton className='h-4 w-16' />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </>
  )
}
