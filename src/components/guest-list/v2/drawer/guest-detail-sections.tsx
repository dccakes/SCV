'use client'

import type * as React from 'react'

import { cn } from '~/lib/utils'

type GuestDetailSectionsProps = {
  children: React.ReactNode
  className?: string
}

type GuestDetailSectionProps = {
  title: string
  children: React.ReactNode
  className?: string
  contentClassName?: string
  action?: React.ReactNode
}

export function GuestDetailSections(props: Readonly<GuestDetailSectionsProps>) {
  const { children, className } = props

  return <div className={cn('space-y-5', className)}>{children}</div>
}

export function GuestDetailSection(props: Readonly<GuestDetailSectionProps>) {
  const { title, children, className, contentClassName, action } = props

  return (
    <section
      className={cn(
        'space-y-2 border-border/70 border-b pb-4 last:border-b-0 last:pb-0',
        className
      )}
    >
      <div className='flex items-center justify-between gap-3'>
        <h3 className='font-mono text-[0.58rem] text-foreground/60 uppercase tracking-widest'>
          {title}
        </h3>
        {action}
      </div>
      <div className={cn('text-muted-foreground text-sm', contentClassName)}>{children}</div>
    </section>
  )
}
