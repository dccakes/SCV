'use client'

import { useEffect, useState } from 'react'

import { Dialog, DialogContent, DialogTrigger } from '~/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import type { MilestoneWithEffectiveStatus } from '~/server/domains/milestone'

type MilestoneDetailProps = Readonly<{
  milestone: MilestoneWithEffectiveStatus
  trigger: React.ReactNode
  onAttest: (milestoneId: string) => void
  onDismiss: (milestoneId: string) => void
  onClearOverride: (milestoneId: string) => void
  viewport?: 'desktop' | 'mobile'
}>

type MilestoneOverrideChoice = 'attested' | 'dismissed' | 'system'

export function MilestoneDetail({
  milestone,
  trigger,
  onAttest,
  onDismiss,
  onClearOverride,
  viewport,
}: MilestoneDetailProps) {
  const [open, setOpen] = useState(false)
  const isDesktop = useIsDesktopViewport(viewport)

  const content = (
    <MilestoneDetailContent
      milestone={milestone}
      onAttest={onAttest}
      onDismiss={onDismiss}
      onClearOverride={onClearOverride}
    />
  )

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent align='start' className='w-[360px] p-0'>
          {content}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        aria-label={milestone.title}
        className='top-auto right-0 bottom-0 left-0 max-w-none translate-x-0 translate-y-0 rounded-t-[8px] sm:top-[50%] sm:left-[50%] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[8px]'
      >
        {content}
      </DialogContent>
    </Dialog>
  )
}

function MilestoneDetailContent({
  milestone,
  onAttest,
  onDismiss,
  onClearOverride,
}: Readonly<{
  milestone: MilestoneWithEffectiveStatus
  onAttest: (milestoneId: string) => void
  onDismiss: (milestoneId: string) => void
  onClearOverride: (milestoneId: string) => void
}>) {
  const selectedValue = getSelectedOverrideChoice(milestone)

  const handleChange = (value: MilestoneOverrideChoice) => {
    if (value === 'attested') {
      onAttest(milestone.id)
      return
    }

    if (value === 'dismissed') {
      onDismiss(milestone.id)
      return
    }

    onClearOverride(milestone.id)
  }

  return (
    <div className='space-y-4 p-6'>
      <div className='space-y-2 text-left'>
        <h2 className='font-display text-2xl italic'>{milestone.title}</h2>
        <p className='text-muted-foreground text-sm'>
          Review the system-derived milestone status or override it manually.
        </p>
      </div>

      <div className='rounded-lg border border-border/70 bg-card px-4 py-3'>
        <p className='font-mono text-[0.62rem] text-muted-foreground uppercase tracking-[0.12em]'>
          Effective status: {milestone.effectiveStatus}
        </p>
        <p className='mt-2 font-serif text-foreground/75 text-sm'>
          System status: {milestone.derivedStatus}
        </p>
      </div>

      <fieldset className='space-y-2'>
        <legend className='font-mono text-[0.62rem] text-muted-foreground uppercase tracking-[0.12em]'>
          Override
        </legend>

        <label className='flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 px-4 py-3 hover:bg-muted/30'>
          <input
            type='radio'
            name={`milestone-${milestone.id}-override`}
            aria-label='Mark as done'
            checked={selectedValue === 'attested'}
            onChange={() => handleChange('attested')}
          />
          <span>
            <span className='block font-sans text-foreground text-sm'>Mark as done</span>
            <span className='block font-serif text-muted-foreground text-sm'>
              Attest that this milestone is complete.
            </span>
          </span>
        </label>

        <label className='flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 px-4 py-3 hover:bg-muted/30'>
          <input
            type='radio'
            name={`milestone-${milestone.id}-override`}
            aria-label='Mark as not done'
            checked={selectedValue === 'dismissed'}
            onChange={() => handleChange('dismissed')}
          />
          <span>
            <span className='block font-sans text-foreground text-sm'>Mark as not done</span>
            <span className='block font-serif text-muted-foreground text-sm'>
              Force the milestone back to pending.
            </span>
          </span>
        </label>

        <label className='flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 px-4 py-3 hover:bg-muted/30'>
          <input
            type='radio'
            name={`milestone-${milestone.id}-override`}
            aria-label='Use system status'
            checked={selectedValue === 'system'}
            onChange={() => handleChange('system')}
          />
          <span>
            <span className='block font-sans text-foreground text-sm'>Use system status</span>
            <span className='block font-serif text-muted-foreground text-sm'>
              Let the milestone follow the live wedding data again.
            </span>
          </span>
        </label>
      </fieldset>
    </div>
  )
}

function getSelectedOverrideChoice(
  milestone: MilestoneWithEffectiveStatus
): MilestoneOverrideChoice {
  if (milestone.userOverrideStatus === 'attested') {
    return 'attested'
  }

  if (milestone.userOverrideStatus === 'dismissed') {
    return 'dismissed'
  }

  return 'system'
}

function useIsDesktopViewport(viewport?: 'desktop' | 'mobile'): boolean {
  const [isDesktop, setIsDesktop] = useState(viewport === 'desktop')

  useEffect(() => {
    if (viewport) {
      setIsDesktop(viewport === 'desktop')
      return
    }

    const mediaQuery = window.matchMedia('(min-width: 768px)')
    const update = () => setIsDesktop(mediaQuery.matches)

    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [viewport])

  return isDesktop
}
