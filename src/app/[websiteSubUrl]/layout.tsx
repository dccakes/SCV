import Image from 'next/image'

import DefaultBanner from '~/app/_components/images/default-banner.jpg'

export default function WeddingWebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="relative h-48 w-full">
        <Image
          alt="Pink Romantic Fresh Art Wedding Banner Background from pngtree.com"
          src={DefaultBanner}
          fill
        />
      </div>
      {children}
    </>
  )
}
