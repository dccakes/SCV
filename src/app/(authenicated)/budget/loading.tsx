import { Skeleton } from '~/components/ui/skeleton'

export default function BudgetLoading() {
  return (
    <div className='px-4 py-6 md:px-6 md:py-8 lg:px-8'>
      <div className='mb-6 md:mb-8'>
        <Skeleton className='h-8 w-36 md:h-10 md:w-44' />
        <Skeleton className='mt-2 h-4 w-56 md:h-5 md:w-72' />
      </div>

      <div className='mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {['a', 'b', 'c', 'd'].map((itemId) => (
          <div key={`budget-summary-loading-${itemId}`} className='rounded-lg border p-4'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='mt-3 h-7 w-28' />
          </div>
        ))}
      </div>

      <div className='space-y-4'>
        {['a', 'b', 'c'].map((itemId) => (
          <div key={`budget-category-loading-${itemId}`} className='rounded-lg border p-4'>
            <Skeleton className='h-5 w-40' />
            <Skeleton className='mt-3 h-2 w-full' />
            <Skeleton className='mt-4 h-12 w-full' />
          </div>
        ))}
      </div>
    </div>
  )
}
