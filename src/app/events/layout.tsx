import Footer from '~/app/_components/footer'
import Navbar from '~/app/_components/navbar'

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  )
}
