import Link from 'next/link'

import { SignInButton } from '~/components/auth-buttons'

const features = [
  {
    n: '01',
    icon: '✉',
    title: 'Smart Invitations',
    desc: 'Send beautiful, personalised digital invitations with unique guest links, tracking, and automatic follow-ups for non-openers.',
    tag: 'RSVP Engine',
  },
  {
    n: '02',
    icon: '◉',
    title: 'RSVP Management',
    desc: 'Real-time response tracking with dietary preferences, plus-ones, table assignments, and exportable guest lists.',
    tag: 'Real-time',
  },
  {
    n: '03',
    icon: '◈',
    title: 'Planning Board',
    desc: 'Vendor management, task tracking, budget envelopes, and timeline views — all in one unified planning workspace.',
    tag: 'Timeline',
  },
  {
    n: '04',
    icon: '⊹',
    title: 'Seating & Logistics',
    desc: 'Drag-and-drop seating arrangements that respect dietary needs, relationships, and family dynamics. Auto-suggest included.',
    tag: 'Auto-suggest',
  },
  {
    n: '05',
    icon: '◐',
    title: 'Vendor Hub',
    desc: 'Centralise contracts, payments, contact details, and deadlines for every vendor. Get reminded before anything slips.',
    tag: 'Reminders',
  },
  {
    n: '06',
    icon: '✦',
    title: 'Wedding Website',
    desc: 'Publish a custom RSVP-enabled wedding website in minutes. Themes, custom domains, and a registry integration layer.',
    tag: 'Custom Domain',
  },
]

const stack = [
  { layer: 'API Layer', name: 'Hono + TypeScript', detail: 'REST + Webhooks · Type-safe schemas' },
  { layer: 'Database', name: 'PostgreSQL / Supabase', detail: 'Drizzle ORM · Bring your own host' },
  { layer: 'Etta / AI', name: 'Claude / OpenAI', detail: 'Tool use · Agentic actions · Pluggable' },
  {
    layer: 'Email & Invites',
    name: 'Resend / Postmark',
    detail: 'MJML templates · Tracking pixels',
  },
  { layer: 'Auth', name: 'Better Auth', detail: 'Guest magic links · Admin OAuth' },
  { layer: 'Deployment', name: 'Docker / Railway', detail: 'One-click · Self-hosted · Edge-ready' },
]

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

const ettaExamples = [
  '"Who hasn\'t RSVP\'d? Send them a nudge."',
  '"What\'s left to pay the florist?"',
  '"Draft a seating plan, keep the exes apart."',
  '"Summarise all vendor emails from this week."',
  '"Are we over budget? What can we cut?"',
]

export default function NonAuthenticatedView() {
  return (
    <>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .cur { display:inline-block; width:8px; height:14px; background:rgba(255,255,255,.65); vertical-align:middle; animation:blink 1.1s step-end infinite; }
        @keyframes float { 0%,100%{transform:translateY(0) rotate(-.3deg)} 50%{transform:translateY(-10px) rotate(.3deg)} }
        .term-float { animation:float 6s ease-in-out infinite; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        .fu  { animation:fadeUp .75s ease both; }
        .fu1 { animation-delay:.12s; }
        .fu2 { animation-delay:.26s; }
        .fu3 { animation-delay:.40s; }
        @keyframes statusPulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        .status-dot { animation:statusPulse 2s infinite; }
        html { scroll-padding-top:72px; }
      `}</style>

      <div className='overflow-x-hidden bg-background text-foreground'>
        {/* ── NAV ─────────────────────────────────────────────── */}
        <nav className='fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-border border-b bg-background/90 px-6 py-4 backdrop-blur-md md:px-12'>
          <Link
            href='/'
            className='flex items-center gap-1 font-medium font-mono text-[0.82rem] text-foreground uppercase tracking-[.2em]'
          >
            OSWP
            <span className='ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-primary align-super' />
          </Link>

          <ul className='hidden items-center gap-7 md:flex'>
            {[
              { href: '#features', label: 'Features' },
              { href: '#etta', label: 'Etta AI' },
              { href: '#stack', label: 'Architecture' },
              { href: '#pricing', label: 'Pricing' },
              {
                href: 'https://github.com/dccakes/SCV',
                label: 'GitHub ↗',
                external: true,
              },
            ].map(({ href, label, external }) => (
              <li key={label}>
                <a
                  href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  className='font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[.12em] transition-colors hover:text-foreground'
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          <SignInButton />
        </nav>

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className='grid min-h-screen grid-cols-1 pt-16 md:grid-cols-2'>
          <div className='flex flex-col justify-center px-6 py-24 md:px-12 md:py-20'>
            <p className='fu mb-6 flex items-center gap-3 font-mono text-[0.62rem] text-primary uppercase tracking-[.2em]'>
              <span className='block h-px w-7 bg-primary' />
              Open Source Wedding Platform
            </p>
            <h1 className='fu fu1 font-normal font-serif text-[clamp(3rem,5.5vw,5rem)] leading-[1.06] tracking-tight'>
              The <em className='text-primary italic'>infrastructure</em>
              <br />
              for your forever
            </h1>
            <p className='fu fu2 mt-6 max-w-md font-light font-serif text-[1.05rem] text-muted-foreground leading-[1.75]'>
              A self-hosted platform with everything your wedding needs — invitations, RSVPs,
              planning, and Etta, your AI wedding planner, thinking with you every step of the way.
            </p>
            <div className='fu fu3 mt-10 flex flex-wrap items-center gap-5'>
              <Link
                href='/auth/signin'
                className='inline-flex items-center gap-2 rounded-sm bg-foreground px-6 py-3.5 font-mono text-[0.68rem] text-background uppercase tracking-[.1em] transition-all hover:-translate-y-0.5 hover:bg-primary'
              >
                ⌘ Get Started
              </Link>
              <a
                href='#features'
                className='inline-flex items-center gap-1.5 border-transparent border-b font-mono text-[0.68rem] text-muted-foreground uppercase tracking-[.1em] transition-colors hover:border-foreground hover:text-foreground'
              >
                Explore features →
              </a>
            </div>
          </div>

          {/* Terminal */}
          <div className='fu fu2 flex items-center justify-center px-6 py-16 md:px-10'>
            <div className='term-float w-full max-w-[500px] overflow-hidden rounded-lg bg-foreground shadow-2xl'>
              <div className='flex items-center gap-1.5 border-white/5 border-b bg-white/[.03] px-4 py-3'>
                <span className='h-2.5 w-2.5 rounded-full bg-[#FF5F57]' />
                <span className='h-2.5 w-2.5 rounded-full bg-[#FFBD2E]' />
                <span className='h-2.5 w-2.5 rounded-full bg-[#28C840]' />
                <span className='mx-auto translate-x-5 font-mono text-[0.58rem] text-white/25 tracking-[.1em]'>
                  OSWP — bash
                </span>
              </div>
              <div className='px-5 py-5 font-mono text-[0.74rem] leading-[1.9]'>
                <p className='text-white/25'># deploy your wedding platform</p>
                <p className='mt-2'>
                  <span className='mr-2 text-white/20'>›</span>
                  <span className='text-[#E5C07B]'>npx</span>{' '}
                  <span className='text-[#98C379]'>create-oswp-app</span>
                </p>
                <p className='text-white/55'>{'  '}✦ Scaffolding your event...</p>
                <p className='text-white/55'>{'  '}✦ Setting up invite engine</p>
                <p className='text-white/55'>{'  '}✦ Connecting RSVP webhooks</p>
                <p className='mt-2'>
                  <span className='mr-2 text-white/20'>›</span>
                  <span className='text-[#E5C07B]'>oswp</span>{' '}
                  <span className='text-[#98C379]'>invite</span>{' '}
                  <span className='text-[#C678DD]'>--template botanical</span>
                </p>
                <p className='text-[#61AFEF]'>{'  '}→ 127 guests added</p>
                <p className='text-[#61AFEF]'>{'  '}→ Personalised links generated</p>
                <p className='mt-2'>
                  <span className='mr-2 text-white/20'>›</span>
                  <span className='text-[#E5C07B]'>etta</span>{' '}
                  <span className='text-[#C678DD]'>"who hasn't RSVP'd yet?"</span>
                </p>
                <p className='text-[#E06C75]'>{'  '}✦ Etta thinking...</p>
                <p className='text-white/55'>{'  '}23 guests pending — want me</p>
                <p className='pb-4 text-white/55'>
                  {'  '}to send a gentle nudge?
                  <span className='cur' />
                </p>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className='col-span-full flex flex-wrap border-border border-t'>
            {[
              { n: '∞', label: 'Guest capacity' },
              { n: '100%', label: 'Self-hostable' },
              { n: '0', label: 'Vendor lock-in' },
              { n: 'FSL', label: 'Source license' },
            ].map(({ n, label }, i) => (
              <div
                key={label}
                className={`flex flex-1 basis-1/2 items-baseline gap-2.5 px-6 py-6 md:basis-0 ${i < 3 ? 'border-border border-r' : ''}`}
              >
                <span className='font-serif text-[2rem] leading-none'>{n}</span>
                <span className='font-mono text-[0.6rem] text-muted-foreground uppercase tracking-[.12em]'>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────── */}
        <section id='features' className='mx-auto w-full max-w-6xl px-6 py-28 md:px-12'>
          <p className='mb-3 flex items-center gap-3 font-mono text-[0.6rem] text-primary uppercase tracking-[.2em]'>
            <span className='block h-px w-5 bg-primary' />
            What's inside
          </p>
          <h2 className='font-normal font-serif text-[clamp(2rem,4vw,3rem)] leading-[1.1] tracking-tight'>
            Everything you need,
            <br />
            <em className='text-primary italic'>nothing you don't</em>
          </h2>

          <div className='mt-14 overflow-hidden rounded border border-border bg-border'>
            <div className='grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3'>
              {features.map((f) => (
                <div
                  key={f.n}
                  className='group relative overflow-hidden bg-background px-8 py-10 transition-colors hover:bg-muted/50'
                >
                  <span className='pointer-events-none absolute top-4 right-5 font-serif text-[4.5rem] text-foreground/[.04] leading-none transition-colors group-hover:text-primary/[.07]'>
                    {f.n}
                  </span>
                  <span className='mb-5 block text-[1.35rem]'>{f.icon}</span>
                  <h3 className='mb-2 font-serif text-[1.2rem] leading-snug'>{f.title}</h3>
                  <p className='font-light font-serif text-[0.9rem] text-muted-foreground leading-[1.65]'>
                    {f.desc}
                  </p>
                  <span className='mt-5 inline-block rounded-sm bg-emerald-500/10 px-2.5 py-1 font-mono text-[0.57rem] text-emerald-600 uppercase tracking-[.1em]'>
                    {f.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <p className='py-2 text-center font-serif text-[1.1rem] text-muted-foreground/35 tracking-[.8em]'>
          ❧ ✦ ❧
        </p>

        {/* ── ETTA ─────────────────────────────────────────────── */}
        <section id='etta' className='bg-foreground py-28 text-background'>
          <div className='mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 md:grid-cols-2 md:px-12'>
            <div>
              <p className='mb-3 flex items-center gap-3 font-mono text-[0.6rem] text-accent uppercase tracking-[.2em]'>
                <span className='block h-px w-5 bg-accent' />
                Meet Etta
              </p>
              <h2 className='font-normal font-serif text-[clamp(2rem,4vw,3rem)] text-background leading-[1.1] tracking-tight'>
                Your AI wedding
                <br />
                <em className='text-accent italic'>planner, Etta</em>
              </h2>
              <p className='mt-6 max-w-md font-light font-serif text-[1rem] text-background/60 leading-[1.75]'>
                Etta is OSWP's built-in AI wedding planner. She lives inside your planning data,
                understands your wedding end-to-end, and can actually take actions — not just answer
                questions.
              </p>
              <ul className='mt-8 flex flex-col gap-3.5'>
                {ettaExamples.map((q) => (
                  <li
                    key={q}
                    className='flex items-start gap-3 font-mono text-[0.73rem] text-background/60 tracking-[.02em]'
                  >
                    <span className='mt-px flex-shrink-0 text-accent'>→</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>

            {/* Chat widget */}
            <div className='overflow-hidden rounded-lg border border-white/10 bg-white/[.04]'>
              <div className='flex items-center gap-3 border-white/10 border-b px-5 py-4'>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary font-serif text-[1rem] text-background italic'>
                  E
                </div>
                <div>
                  <span className='font-serif text-[0.95rem] text-background/95 italic'>Etta</span>
                  <span className='ml-1.5 font-mono text-[0.57rem] text-background/35 tracking-[.08em]'>
                    · OSWP AI Planner
                  </span>
                </div>
                <div className='ml-auto flex items-center gap-1.5 font-mono text-[0.57rem] text-emerald-400'>
                  <span className='status-dot h-1.5 w-1.5 rounded-full bg-emerald-400' />
                  online
                </div>
              </div>

              <div className='flex flex-col gap-4 p-5'>
                <div>
                  <div className='ml-auto max-w-[85%] rounded rounded-br-none bg-white/[.07] px-4 py-3 font-serif text-[0.84rem] text-background/80 italic leading-relaxed'>
                    "We're 3 weeks out. What's most urgent?"
                  </div>
                  <p className='mt-1 text-right font-mono text-[0.57rem] text-background/25'>
                    you · just now
                  </p>
                </div>
                <div>
                  <div className='mr-auto max-w-[85%] rounded rounded-bl-none border border-accent/20 bg-accent/10 px-4 py-3 font-serif text-[0.84rem] text-background/80 leading-relaxed'>
                    Looking at your timeline — 3 things need attention: caterer headcount due
                    Friday, 12 guests haven't RSVP'd, and the rehearsal dinner deposit is 4 days
                    overdue. Want me to handle any of these?
                  </div>
                  <p className='mt-1 font-mono text-[0.57rem] text-background/25'>
                    Etta · just now
                  </p>
                </div>
                <div>
                  <div className='ml-auto max-w-[85%] rounded rounded-br-none bg-white/[.07] px-4 py-3 font-serif text-[0.84rem] text-background/80 italic leading-relaxed'>
                    "Yes, chase the guests and flag the deposit."
                  </div>
                  <p className='mt-1 text-right font-mono text-[0.57rem] text-background/25'>
                    you · just now
                  </p>
                </div>
                <div>
                  <div className='mr-auto max-w-[85%] rounded rounded-bl-none border border-accent/20 bg-accent/10 px-4 py-3 font-serif text-[0.84rem] text-background/80 leading-relaxed'>
                    Sent nudges to 12 guests with your custom message. Emailed the Rosewood deposit
                    reminder — add it to your urgent board?
                  </div>
                  <p className='mt-1 font-mono text-[0.57rem] text-background/25'>
                    Etta · just now
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-3 border-white/10 border-t px-5 py-3'>
                <input
                  type='text'
                  placeholder='Ask Etta anything…'
                  readOnly
                  className='flex-1 bg-transparent font-serif text-[0.82rem] text-background/35 italic outline-none placeholder:text-background/35'
                />
                <div className='flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary font-mono text-[0.65rem] text-background'>
                  →
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── ARCHITECTURE ─────────────────────────────────────── */}
        <section
          id='stack'
          className='mx-auto w-full max-w-6xl border-border border-t px-6 py-28 md:px-12'
        >
          <div className='mb-14 grid grid-cols-1 items-end gap-10 md:grid-cols-2'>
            <div>
              <p className='mb-3 flex items-center gap-3 font-mono text-[0.6rem] text-primary uppercase tracking-[.2em]'>
                <span className='block h-px w-5 bg-primary' />
                Built for developers
              </p>
              <h2 className='font-normal font-serif text-[clamp(2rem,4vw,3rem)] leading-[1.1] tracking-tight'>
                A backend you
                <br />
                <em className='text-primary italic'>actually own</em>
              </h2>
            </div>
            <p className='font-light font-serif text-[0.95rem] text-muted-foreground leading-[1.75]'>
              OSWP is a self-hosted TypeScript backend with a clean REST API. Bring your own
              database, cloud, and AI provider. Everything is modular, documented, and ready to
              extend.
            </p>
          </div>

          <div className='overflow-hidden rounded border border-border bg-border'>
            <div className='grid grid-cols-1 gap-px sm:grid-cols-2'>
              {stack.map((s) => (
                <div
                  key={s.layer}
                  className='bg-background px-6 py-6 transition-colors hover:bg-muted/50'
                >
                  <p className='mb-1 font-mono text-[0.57rem] text-emerald-600 uppercase tracking-[.15em]'>
                    {s.layer}
                  </p>
                  <p className='font-serif text-[1.1rem]'>{s.name}</p>
                  <p className='mt-0.5 font-mono text-[0.62rem] text-muted-foreground tracking-[.04em]'>
                    {s.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ──────────────────────────────────────────── */}
        <section
          id='pricing'
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
            Run OSWP on your own infrastructure forever, or choose our fully managed cloud — no ops,
            no maintenance, just your wedding.
          </p>

          <div className='mt-14 overflow-hidden rounded border border-border bg-border'>
            <div className='grid grid-cols-1 gap-px sm:grid-cols-3'>
              {/* Community */}
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
                  The full OSWP platform, self-hosted on your own infrastructure. No limits, no
                  lock-in.
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
                      <span>–</span> {item}
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

              {/* Couple — featured */}
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
                    <span>–</span> White-glove concierge
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

              {/* Planner */}
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
            OSWP is source-available under FSL-1.1 — self-hosting is free forever, commercial
            hosting rights are reserved.
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

        {/* ── OSS BAND ─────────────────────────────────────────── */}
        <div className='relative overflow-hidden bg-primary px-6 py-24 text-center'>
          <p className='mb-5 font-mono text-[0.63rem] text-white/55 uppercase tracking-[.2em]'>
            Free &amp; Open Source
          </p>
          <h2 className='font-normal font-serif text-[clamp(2rem,4vw,3rem)] text-white'>
            Built with love.
            <br />
            Shared with everyone.
          </h2>
          <p className='mx-auto mt-5 max-w-lg font-light font-serif text-[1rem] text-white/70 leading-[1.75]'>
            OSWP is source-available under FSL-1.1 and built in the open. Star it, fork it,
            contribute, or self-host for free. No guest limits. No data harvested. Etta included.
          </p>
          <div className='mt-10 flex flex-wrap items-center justify-center gap-4'>
            <a
              href='https://github.com/dccakes/SCV'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-2 rounded-sm bg-background px-7 py-3.5 font-mono text-[0.67rem] text-primary uppercase tracking-[.1em] transition-all hover:-translate-y-0.5 hover:opacity-90'
            >
              ⌘ Star on GitHub
            </a>
            <a
              href='https://github.com/dccakes/SCV#readme'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-2 rounded-sm border border-white/35 px-7 py-3.5 font-mono text-[0.67rem] text-white uppercase tracking-[.1em] transition-all hover:-translate-y-0.5 hover:border-white'
            >
              Read the docs →
            </a>
          </div>
        </div>

        {/* ── FOOTER ───────────────────────────────────────────── */}
        <footer className='mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 border-border border-t px-6 py-8 sm:flex-row md:px-12'>
          <Link
            href='/'
            className='font-medium font-mono text-[0.78rem] text-foreground uppercase tracking-[.2em]'
          >
            OSWP
          </Link>
          <p className='font-mono text-[0.6rem] text-muted-foreground tracking-[.08em]'>
            FSL-1.1 License · Made with intention
          </p>
          <ul className='flex gap-6'>
            {[
              { label: 'Docs', href: 'https://github.com/dccakes/SCV#readme' },
              { label: 'GitHub', href: 'https://github.com/dccakes/SCV' },
              { label: 'Discord', href: 'https://github.com/dccakes/SCV/discussions' },
              { label: 'Changelog', href: 'https://github.com/dccakes/SCV/releases' },
            ].map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='font-mono text-[0.6rem] text-muted-foreground uppercase tracking-[.1em] transition-colors hover:text-foreground'
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </footer>
      </div>
    </>
  )
}
