import { AcceptInvitationCard } from '@daveyplate/better-auth-ui'

export default function AcceptInvitationPage() {
  return (
    <main className='relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10'>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(196,99,58,0.16),_transparent_42%),linear-gradient(180deg,rgba(244,238,227,0.98),rgba(244,238,227,0.88))]' />
      <div className='relative w-full max-w-xl rounded-2xl border border-border/70 bg-card/95 p-6 shadow-[0_24px_80px_rgba(46,38,32,0.12)] backdrop-blur-sm sm:p-8'>
        <div className='mb-6 space-y-2 text-center'>
          <p className='font-mono text-[0.62rem] text-foreground/50 uppercase tracking-[0.3em]'>
            Wedding Workspace
          </p>
          <h1 className='font-display text-4xl text-foreground italic'>
            Join this wedding workspace
          </h1>
          <p className='mx-auto max-w-md font-sans text-foreground/70 text-sm'>
            Review the invitation details below, then accept to start collaborating in OSWP.
          </p>
        </div>

        <AcceptInvitationCard
          className='border-0 bg-transparent shadow-none'
          classNames={{
            base: 'border-0 bg-transparent shadow-none',
            description: 'text-foreground/70',
            header: 'pb-3 text-center',
          }}
        />
      </div>
    </main>
  )
}
