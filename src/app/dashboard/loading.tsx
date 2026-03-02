import { sharedStyles } from '~/app/utils/shared-styles'
import { Skeleton } from '~/components/ui/skeleton'

export default function DashboardSkeleton() {
  return (
    <div className={`pt-10 ${sharedStyles.desktopPaddingSides}`}>
      <section className='border-b pb-8'>
        <Skeleton className='mb-3 h-8 w-48' />
        <div className='mt-3 flex items-center gap-2'>
          <Skeleton className='h-8 w-64' />
        </div>
      </section>
      <section className='my-6 py-8'>
        <div className='flex items-start gap-6'>
          <Skeleton className='h-32 w-32 rounded-lg' />
          <div className='flex flex-col gap-3'>
            <Skeleton className='h-7 w-72' />
            <Skeleton className='h-4 w-96' />
            <Skeleton className='h-8 w-32 rounded-full' />
          </div>
        </div>
      </section>
      <div className='border-border border-t' />
      <div className='mt-10'>
        <div className='mb-6 flex justify-between'>
          <Skeleton className='h-7 w-16' />
          <div className='flex gap-3'>
            <Skeleton className='h-7 w-20' />
            <Skeleton className='h-7 w-24' />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className='mb-6 rounded-lg border p-5'>
            <Skeleton className='h-6 w-32' />
          </div>
        ))}
        <div className='mt-10 grid grid-cols-3 gap-4'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='rounded-lg border p-6'>
              <Skeleton className='mb-3 h-9 w-9 rounded-lg' />
              <Skeleton className='mb-1 h-5 w-24' />
              <Skeleton className='h-3 w-40' />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
