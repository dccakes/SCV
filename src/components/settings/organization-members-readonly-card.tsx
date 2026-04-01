'use client'

import { OrganizationMembersCard } from '@daveyplate/better-auth-ui'

export function OrganizationMembersReadOnlyCard() {
  return (
    <div className='rounded-xl border border-border/90 bg-card/85 p-1'>
      <OrganizationMembersCard
        className='border-0 bg-transparent shadow-none'
        classNames={{
          base: 'border-0 bg-transparent shadow-none',
          button: 'hidden',
          content: 'pt-2',
          description: 'text-foreground/70',
          header: 'pb-2',
          instructions: 'font-mono text-[0.62rem] uppercase tracking-widest text-foreground/50',
        }}
        description='People who can access this wedding workspace.'
        instructions='Read-only list'
        disabled
      />
    </div>
  )
}
