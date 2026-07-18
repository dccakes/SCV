import type { ReactNode } from 'react'

export function PageContent({ children }: { children: ReactNode }) {
  return (
    <main className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>{children}</main>
  )
}
