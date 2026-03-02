import { CheckSquare, Globe, Users } from 'lucide-react'

import { SignInButton } from '~/app/_components/auth-buttons'
import { Card, CardContent } from '~/components/ui/card'

const features = [
  {
    icon: Users,
    title: 'Guest Management',
    description:
      'Organize households, track RSVPs per event, and manage dietary notes and gifts in one place.',
  },
  {
    icon: CheckSquare,
    title: 'RSVP Tracking',
    description:
      'Custom questions, multi-event RSVP forms, and real-time response charts — no spreadsheets needed.',
  },
  {
    icon: Globe,
    title: 'Wedding Website',
    description:
      'A shareable, password-protected website for your guests with your story, schedule, and RSVP form.',
  },
]

export default function NonAuthenticatedView() {
  return (
    <div className='flex min-h-screen flex-col'>
      {/* Hero */}
      <section className='flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-background via-accent/10 to-secondary/20 px-6 py-24 text-center'>
        <p className='mb-4 font-semibold text-primary text-xs uppercase tracking-[0.2em]'>
          Open Source Wedding Project
        </p>
        <h1 className='max-w-3xl font-bold font-serif text-5xl text-foreground leading-tight tracking-tight md:text-6xl'>
          Your love story, beautifully planned.
        </h1>
        <p className='mt-6 max-w-xl text-lg text-muted-foreground'>
          Free, open-source wedding planning and RSVP management. Everything you need to organise
          your celebration — no subscriptions, no lock-in.
        </p>
        <div className='mt-10'>
          <SignInButton />
        </div>
      </section>

      {/* Features */}
      <section className='border-t bg-muted/30 px-6 py-20'>
        <div className='mx-auto max-w-5xl'>
          <p className='mb-10 text-center font-medium text-muted-foreground text-sm uppercase tracking-widest'>
            Everything you need
          </p>
          <div className='grid gap-8 sm:grid-cols-3'>
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className='border bg-card shadow-sm'>
                  <CardContent className='p-8'>
                    <div className='mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
                      <Icon className='h-5 w-5 text-primary' />
                    </div>
                    <h3 className='mb-2 font-semibold text-foreground'>{feature.title}</h3>
                    <p className='text-muted-foreground text-sm leading-relaxed'>
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
