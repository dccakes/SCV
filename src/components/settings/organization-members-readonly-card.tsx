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
        }}
        description='People who can access this wedding workspace.'
        disabled
      />
    </div>
  )
}
