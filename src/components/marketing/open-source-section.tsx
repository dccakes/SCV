type OpenSourceSectionProps = {
  includeLongForm?: boolean
}

export default function OpenSourceSection({ includeLongForm = false }: OpenSourceSectionProps) {
  return (
    <section className='relative overflow-hidden bg-primary px-6 py-24 text-center'>
      <p className='mb-5 font-mono text-[0.63rem] text-white/55 uppercase tracking-[.2em]'>
        Free &amp; Open Source
      </p>
      <h2 className='font-normal font-serif text-[clamp(2rem,4vw,3rem)] text-white'>
        Built with love.
        <br />
        Shared with everyone.
      </h2>
      <p className='mx-auto mt-5 max-w-lg font-light font-serif text-[1rem] text-white/70 leading-[1.75]'>
        OSWP is source-available under FSL-1.1 and built in the open. Star it, fork it, contribute,
        or self-host for free. No guest limits. No data harvested. Etta included.
      </p>

      {includeLongForm ? (
        <div className='mx-auto mt-6 max-w-2xl space-y-3 text-left'>
          <p className='font-serif text-[0.95rem] text-white/80 leading-relaxed'>
            We are building in public so couples and planners can audit every change, propose
            improvements, and deploy on infrastructure they control.
          </p>
          <p className='font-serif text-[0.95rem] text-white/80 leading-relaxed'>
            Contributions across product, design, docs, and engineering are welcome through the
            GitHub project and discussions.
          </p>
        </div>
      ) : null}

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
          href='https://github.com/dccakes/SCV/blob/main/CONTRIBUTING.md'
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-2 rounded-sm border border-white/35 px-7 py-3.5 font-mono text-[0.67rem] text-white uppercase tracking-[.1em] transition-all hover:-translate-y-0.5 hover:border-white'
        >
          Contributing guide →
        </a>
        <a
          href='https://github.com/dccakes/SCV#self-hosting'
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-2 rounded-sm border border-white/35 px-7 py-3.5 font-mono text-[0.67rem] text-white uppercase tracking-[.1em] transition-all hover:-translate-y-0.5 hover:border-white'
        >
          Self-hosting docs →
        </a>
      </div>
    </section>
  )
}
