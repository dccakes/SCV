import { Eye } from 'lucide-react'

export function ViewOnlyBanner() {
  return (
    <div
      role='status'
      className='flex items-center gap-2 border-white/10 border-b bg-foreground/5 px-4 py-2 text-foreground/70 text-xs lg:px-6'
    >
      <Eye className='h-3.5 w-3.5 flex-shrink-0' aria-hidden='true' />
      <p>
        <span className='font-medium text-foreground'>View-only access.</span> You can look through
        everything in this wedding, but only an owner, admin, or member can make changes.
      </p>
    </div>
  )
}
