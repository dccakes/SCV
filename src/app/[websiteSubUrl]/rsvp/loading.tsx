import { IoMdClose } from 'react-icons/io'

export default function RsvpPageSkeleton() {
  return (
    <>
      {/* biome-ignore lint/a11y/useSemanticElements: role='status' is the correct ARIA live region for a loading skeleton, not an <output> form element */}
      <div
        role='status'
        className='flex animate-pulse flex-col space-y-8 md:space-y-0 rtl:space-x-reverse'
      >
        <StaticProgressBar />
        <div>
          <div className='mt-20 h-48'>
            <div className='mb-2.5 h-40 w-full bg-gray-200 dark:bg-gray-700'></div>
          </div>
          <div className='m-auto w-[450px] py-5'>
            <div className='flex flex-col gap-5'>
              <div className='mb-2.5 h-12 w-72 bg-gray-200 dark:bg-gray-700'></div>
              <div className='flex flex-col'>
                <div className='mb-2.5 h-4 w-[95%] bg-gray-200 dark:bg-gray-700'></div>
                <div className='mb-2.5 h-4 w-40 bg-gray-200 dark:bg-gray-700'></div>
              </div>
              <div className='mb-2.5 h-10 w-full bg-gray-200 dark:bg-gray-700'></div>
              <div className='mb-2.5 h-10 w-full bg-gray-200 dark:bg-gray-700'></div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const StaticProgressBar = () => {
  return (
    <div className='fixed top-0 z-10 w-full bg-white px-10 py-1 text-center font-serif'>
      <IoMdClose size={25} className='absolute top-2 right-3 z-20 cursor-pointer' />
      <h1 className='py-3 text-2xl'>RSVP</h1>
      <div className='relative mb-2.5 h-3 w-full rounded-full bg-gray-200'>
        <div className='absolute top-0 left-0 mb-2.5 h-3 w-[3%] rounded-full bg-gray-700 transition-[width]'></div>
      </div>
    </div>
  )
}
