import { Skeleton } from '~/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <div className='px-4 py-6 md:px-6 md:py-8 lg:px-8'>
      <Skeleton className='mb-6 h-8 w-36' />
      <Skeleton className='mb-8 h-10 w-48' />
      <div className='rounded-lg border p-6'>
        <Skeleton className='h-6 w-32' />
        <Skeleton className='mt-2 h-4 w-64' />
        <Skeleton className='mt-4 h-10 w-28' />
      </div>
    </div>
  )
}
