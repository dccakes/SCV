import Footer from '~/app/_components/footer'
import Navbar from '~/app/_components/navbar'

export default function SomethingWentWrongPage() {
  return (
    <>
      <Navbar />
      <div className="flex min-h-96 items-center justify-center">
        <div className="flex flex-col gap-5 text-center">
          <h1 className="text-3xl">Something went wrong!</h1>
          <p>Sorry about that. Please refresh the page in a moment.</p>
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
