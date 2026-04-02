'use client'

import { OrganizationMembersCard } from '@daveyplate/better-auth-ui'

export function OrganizationMembersSettingsCard() {
  return (
    <div className='rounded-xl border border-border/90 bg-card/85 p-1'>
      <OrganizationMembersCard
        className='border-0 bg-transparent shadow-none'
        classNames={{
          base: 'border-0 bg-transparent shadow-none',
          content: 'pt-2',
          description: 'text-foreground/70',
          header: 'pb-2',
        }}
        description='Invite collaborators and manage who can access this wedding workspace.'
      />
    </div>
  )
}
