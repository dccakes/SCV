import { Skeleton } from '~/components/ui/skeleton'

export default function InboxLoading() {
  return (
    <div className='px-4 py-6 md:px-6 md:py-8 lg:px-8'>
      <Skeleton className='mb-6 h-10 w-full max-w-md' />
      <div className='space-y-2'>
        {['a', 'b', 'c', 'd', 'e'].map((id) => (
          <div key={`inbox-loading-${id}`} className='rounded-lg border p-4'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-3 w-20' />
            </div>
            <Skeleton className='mt-2 h-4 w-48' />
            <Skeleton className='mt-1 h-3 w-full' />
          </div>
        ))}
      </div>
    </div>
  )
}
