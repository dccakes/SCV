import Link from 'next/link'

import Footer from '~/app/_components/footer'
import Navbar from '~/app/_components/navbar'
import { sharedStyles } from '~/app/utils/shared-styles'

export default function NotFoundPage() {
  return (
    <>
      <Navbar />
      <div className="flex min-h-96 items-center justify-center">
        <div className="flex flex-col gap-5 py-32 text-center">
          <h1 className="pb-5 text-7xl font-bold">We can&apos;t find this page</h1>
          <p>Sorry about that. Let&apos;s find a better place for you to go.</p>
          <div className="py-10">
            <Link href={'/'} className={`p-5 ${sharedStyles.primaryButton()}`}>
              Go to home page
            </Link>
          </div>
          <p>
            Need help?{' '}
            <a href="#" className="underline">
              Search our Help Center or contact us.
            </a>
          </p>
        </div>
      </div>
      <Footer />
    </>
  )
}
