import Image from 'next/image'
import { PostHogSessionRecording } from '~/components/analytics/posthog-session-recording'
import DefaultBanner from '~/components/images/default-banner.jpg'

export default function WeddingWebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PostHogSessionRecording enabled />
      <div className='relative h-48 w-full'>
        <Image
          alt='Pink Romantic Fresh Art Wedding Banner Background from pngtree.com'
          src={DefaultBanner}
          fill
          priority
          sizes='100vw'
          className='object-cover'
        />
      </div>
      {children}
    </>
  )
}
