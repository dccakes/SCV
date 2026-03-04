'use client'

interface DashboardTopbarProps {
  onMenuToggle: () => void
}

export default function DashboardTopbar({ onMenuToggle }: DashboardTopbarProps) {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <header className='flex h-14 flex-shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm lg:px-6'>
      <div className='flex items-center gap-3'>
        {/* Mobile menu trigger */}
        <button
          type='button'
          aria-label='Open sidebar'
          onClick={onMenuToggle}
          className='flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden'
        >
          <svg
            className='h-5 w-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
            />
          </svg>
        </button>

        <div className='flex items-baseline gap-3'>
          <h1 className='font-serif text-xl text-foreground'>Dashboard</h1>
          <span className='hidden font-mono text-[0.62rem] tracking-wider text-muted-foreground sm:block'>
            {today}
          </span>
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <button
          type='button'
          aria-label='Export guest list'
          className='hidden items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition-all hover:border-foreground hover:text-foreground sm:flex'
        >
          Export guest list
        </button>
        <button
          type='button'
          aria-label='Send update'
          className='hidden items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition-all hover:border-foreground hover:text-foreground md:flex'
        >
          Send update
        </button>
        <button
          type='button'
          aria-label='Add task'
          className='flex items-center gap-1.5 rounded-sm bg-foreground px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-background transition-all hover:bg-primary hover:text-primary-foreground'
        >
          + Add task
        </button>
      </div>
    </header>
  )
}
