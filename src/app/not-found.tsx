import Link from 'next/link'
import { sharedStyles } from '~/app/utils/shared-styles'

export default function NotFoundPage() {
  return (
    <div className='flex min-h-screen items-center justify-center px-4'>
      <div className='flex max-w-xl flex-col gap-5 py-16 text-center'>
        <h1 className='pb-5 font-bold text-7xl'>We can&apos;t find this page</h1>
        <p>Sorry about that. Let&apos;s find a better place for you to go.</p>
        <div className='py-10'>
          <Link href='/' className={`p-5 ${sharedStyles.primaryButton()}`}>
            Go to home page
          </Link>
        </div>
        <p>
          Need help? <span className='underline'>Search our Help Center or contact us.</span>
        </p>
      </div>
    </div>
  )
}
