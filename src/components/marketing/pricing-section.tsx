import Link from 'next/link'

type PricingSectionProps = {
  sectionId?: string
}

const freeFeatures = [
  'Full source code access',
  'Unlimited guests',
  'All core features',
  'Etta (bring your own key)',
  'Custom domain',
]

const freeMissing = ['Managed hosting', 'Automatic backups', 'Priority support']

const coupleFeatures = [
  'Everything in Community',
  'Managed cloud hosting',
  'Daily automated backups',
  'Etta included',
  'Custom domain setup',
  'Email deliverability managed',
  'Onboarding call',
]

const plannerFeatures = [
  'Everything in Couple',
  'Up to 10 active weddings',
  'Planner dashboard',
  'White-label option',
  'Etta per couple',
  'Priority support',
  'White-glove onboarding',
  'SLA guarantee',
]

export default function PricingSection({ sectionId }: PricingSectionProps) {
  return (
    <section
      id={sectionId}
      className='mx-auto w-full max-w-6xl border-border border-t px-6 py-28 md:px-12'
    >
      <p className='mb-3 flex items-center gap-3 font-mono text-[0.6rem] text-primary uppercase tracking-[.2em]'>
        <span className='block h-px w-5 bg-primary' />
        Pricing
      </p>
      <h2 className='font-normal font-serif text-[clamp(2rem,4vw,3rem)] leading-[1.1] tracking-tight'>
        Self-host free.
        <br />
        <em className='text-primary italic'>Or let us handle it.</em>
      </h2>
      <p className='mt-5 max-w-xl font-light font-serif text-[1rem] text-muted-foreground leading-[1.75]'>
        Run OSWP on your own infrastructure forever, or choose our fully managed cloud, no ops, no
        maintenance, just your wedding.
      </p>

      <div className='mt-14 overflow-hidden rounded border border-border bg-border'>
        <div className='grid grid-cols-1 gap-px sm:grid-cols-3'>
          <div className='flex flex-col bg-background px-8 py-9 transition-colors hover:bg-muted/50'>
            <p className='mb-5 font-mono text-[0.57rem] text-muted-foreground uppercase tracking-[.18em]'>
              Community
            </p>
            <div className='mb-3 flex items-baseline gap-1.5'>
              <span className='font-serif text-[3rem] leading-none'>£0</span>
              <span className='font-mono text-[0.62rem] text-muted-foreground tracking-[.06em]'>
                forever
              </span>
            </div>
            <p className='mb-6 min-h-[3.5rem] font-light font-serif text-[0.88rem] text-muted-foreground leading-relaxed'>
              The full OSWP platform, self-hosted on your own infrastructure. No limits, no lock-in.
            </p>
            <div className='my-5 h-px bg-border' />
            <ul className='mb-8 flex flex-1 flex-col gap-3'>
              {freeFeatures.map((item) => (
                <li
                  key={item}
                  className='flex items-center gap-2.5 font-mono text-[0.67rem] tracking-[.02em]'
                >
                  <span className='text-emerald-600'>✓</span> {item}
                </li>
              ))}
              {freeMissing.map((item) => (
                <li
                  key={item}
                  className='flex items-center gap-2.5 font-mono text-[0.67rem] text-muted-foreground/40 tracking-[.02em]'
                >
                  <span>-</span> {item}
                </li>
              ))}
            </ul>
            <a
              href='https://github.com/dccakes/SCV'
              target='_blank'
              rel='noopener noreferrer'
              className='mt-auto block rounded-sm border border-border py-3.5 text-center font-mono text-[0.67rem] text-foreground uppercase tracking-[.1em] transition-all hover:-translate-y-0.5 hover:border-foreground'
            >
              ⌘ Deploy yourself →
            </a>
          </div>

          <div className='relative flex flex-col bg-foreground px-8 py-9 text-background'>
            <div className='absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-primary to-accent' />
            <p className='mb-5 font-mono text-[0.57rem] text-accent uppercase tracking-[.18em]'>
              Couple
            </p>
            <div className='mb-3 flex items-baseline gap-1.5'>
              <span className='font-serif text-[3rem] text-background leading-none'>£12</span>
              <span className='font-mono text-[0.62rem] text-background/40 tracking-[.06em]'>
                / month
              </span>
            </div>
            <p className='mb-6 min-h-[3.5rem] font-light font-serif text-[0.88rem] text-background/55 leading-relaxed'>
              Fully managed. We handle the servers, backups, and updates so you can focus on the
              wedding.
            </p>
            <div className='my-5 h-px bg-white/10' />
            <ul className='mb-8 flex flex-1 flex-col gap-3'>
              {coupleFeatures.map((item) => (
                <li
                  key={item}
                  className='flex items-center gap-2.5 font-mono text-[0.67rem] text-background/75 tracking-[.02em]'
                >
                  <span className='text-accent'>✓</span> {item}
                </li>
              ))}
              <li className='flex items-center gap-2.5 font-mono text-[0.67rem] text-background/25 tracking-[.02em]'>
                <span>-</span> White-glove concierge
              </li>
            </ul>
            <Link
              href='/auth/signin'
              className='mt-auto block rounded-sm bg-primary py-3.5 text-center font-mono text-[0.67rem] text-background uppercase tracking-[.1em] transition-all hover:-translate-y-0.5 hover:bg-accent'
            >
              Start free trial →
            </Link>
            <p className='mt-3 text-center font-mono text-[0.57rem] text-background/25 tracking-[.04em]'>
              14-day free trial · Cancel anytime
            </p>
          </div>

          <div className='flex flex-col bg-background px-8 py-9 transition-colors hover:bg-muted/50'>
            <p className='mb-5 font-mono text-[0.57rem] text-muted-foreground uppercase tracking-[.18em]'>
              Planner
            </p>
            <div className='mb-3 flex items-baseline gap-1.5'>
              <span className='font-serif text-[3rem] leading-none'>£49</span>
              <span className='font-mono text-[0.62rem] text-muted-foreground tracking-[.06em]'>
                / month
              </span>
            </div>
            <p className='mb-6 min-h-[3.5rem] font-light font-serif text-[0.88rem] text-muted-foreground leading-relaxed'>
              For wedding planners managing multiple couples. One dashboard, multiple events,
              white-label ready.
            </p>
            <div className='my-5 h-px bg-border' />
            <ul className='mb-8 flex flex-1 flex-col gap-3'>
              {plannerFeatures.map((item) => (
                <li
                  key={item}
                  className='flex items-center gap-2.5 font-mono text-[0.67rem] tracking-[.02em]'
                >
                  <span className='text-emerald-600'>✓</span> {item}
                </li>
              ))}
            </ul>
            <a
              href='mailto:hello@oswp.dev'
              className='mt-auto block rounded-sm border border-border py-3.5 text-center font-mono text-[0.67rem] text-foreground uppercase tracking-[.1em] transition-all hover:-translate-y-0.5 hover:border-foreground'
            >
              Get in touch →
            </a>
          </div>
        </div>
      </div>

      <p className='mt-12 text-center font-mono text-[0.63rem] text-muted-foreground leading-[1.9] tracking-[.04em]'>
        OSWP is source-available under FSL-1.1, self-hosting is free forever, commercial hosting
        rights are reserved.
        <br />
        Cloud hosting is how we fund continued development.{' '}
        <a
          href='https://github.com/dccakes/SCV'
          target='_blank'
          rel='noopener noreferrer'
          className='border-transparent border-b text-primary transition-colors hover:border-primary'
        >
          Read our license ↗
        </a>
      </p>
    </section>
  )
}
