type InvalidHouseholdInviteProps = {
  websiteSubUrl: string
}

export function InvalidHouseholdInvite({ websiteSubUrl }: InvalidHouseholdInviteProps) {
  return (
    <main className='min-h-screen bg-background px-5 py-10 text-foreground'>
      <section className='mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-2xl flex-col justify-center'>
        <p className='mb-5 font-mono text-muted-foreground text-xs uppercase tracking-[0.28em]'>
          Save the date
        </p>
        <h1 className='font-display text-5xl italic leading-none md:text-7xl'>
          We could not open this invitation.
        </h1>
        <p className='mt-8 max-w-xl font-sans text-muted-foreground leading-7'>
          This invite link may be expired, mistyped, or opened without the original household link.
          Please use the save-the-date link you received, or ask the couple for a new one.
        </p>
        <p className='mt-6 font-mono text-muted-foreground text-xs uppercase tracking-[0.22em]'>
          {websiteSubUrl}
        </p>
      </section>
    </main>
  )
}
