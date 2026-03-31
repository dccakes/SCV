'use client'

import GmailConnectionCard from '~/components/settings/gmail-connection-card'

export default function ConnectionsTab() {
  return (
    <div className='space-y-4'>
      <div>
        <h2 className='font-serif text-lg text-foreground'>Integrations</h2>
        <p className='mt-1 font-mono text-xs text-foreground/60'>
          Connect your accounts to centralize vendor communications.
        </p>
      </div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <GmailConnectionCard />
      </div>
    </div>
  )
}
