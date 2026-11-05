'use client'

import { Eye, EyeOff, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'
import { api } from '~/trpc/react'

type WebsitePasswordCardProps = Readonly<{
  initialIsPasswordEnabled: boolean
}>

/**
 * Couple-facing control for password-protecting the public wedding website.
 *
 * Guests who already opened a save-the-date / invite link are recognised by
 * their stored invite cookie and skip this password entirely — so the password
 * is the fallback for anyone the couple shares the bare link with.
 */
export function WebsitePasswordCard({ initialIsPasswordEnabled }: WebsitePasswordCardProps) {
  const router = useRouter()
  const [isEnabled, setIsEnabled] = useState(initialIsPasswordEnabled)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const updateWebsite = api.website.update.useMutation({
    onSuccess: (website) => {
      setIsEnabled(website.isPasswordEnabled)
      setPassword('')
      toast.success(
        website.isPasswordEnabled ? 'Password protection is on' : 'Password protection is off'
      )
      router.refresh()
    },
    onError: (error) => {
      toast.error('Could not update password protection', {
        description: error.message ?? 'Please try again later.',
      })
    },
  })

  const isSaving = updateWebsite.isPending

  const handleToggle = (checked: boolean) => {
    if (!checked) {
      // Turning protection off needs no password.
      updateWebsite.mutate({ isPasswordEnabled: false })
      return
    }
    // Reveal the password field; the couple confirms with Save.
    setIsEnabled(true)
  }

  const handleSavePassword = () => {
    const trimmed = password.trim()
    if (!trimmed) {
      toast.error('Choose a password to protect your site')
      return
    }
    updateWebsite.mutate({ isPasswordEnabled: true, password: trimmed })
  }

  return (
    <Card className='border-border/80 bg-card/80'>
      <CardHeader className='space-y-3'>
        <p className='font-mono text-[0.62rem] text-foreground/45 uppercase tracking-[0.18em]'>
          Privacy
        </p>
        <CardTitle className='flex items-center gap-2 font-serif text-2xl text-foreground'>
          <Lock aria-hidden='true' className='h-5 w-5' />
          Password protection
        </CardTitle>
        <p className='max-w-2xl font-sans text-muted-foreground text-sm leading-6'>
          Require a password before guests can view your main wedding page. Guests who open their
          save-the-date or invite link are recognised automatically and won&apos;t be asked for it.
        </p>
      </CardHeader>
      <CardContent className='space-y-5'>
        <div className='flex items-center justify-between gap-4'>
          <Label htmlFor='website-password-toggle' className='font-medium text-foreground text-sm'>
            Require a password
          </Label>
          <Switch
            id='website-password-toggle'
            checked={isEnabled}
            disabled={isSaving}
            onCheckedChange={handleToggle}
          />
        </div>

        {isEnabled ? (
          <div className='space-y-2'>
            <Label htmlFor='website-password-input' className='text-foreground/80 text-sm'>
              {initialIsPasswordEnabled ? 'Update guest password' : 'Set a guest password'}
            </Label>
            <div className='flex flex-wrap items-center gap-2'>
              <div className='relative max-w-xs'>
                <Input
                  id='website-password-input'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='off'
                  spellCheck={false}
                  placeholder='e.g. ForeverTogether'
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className='pr-9'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className='absolute inset-y-0 right-2.5 flex items-center text-foreground/40 hover:text-foreground/70'
                >
                  {showPassword ? (
                    <EyeOff aria-hidden='true' className='h-4 w-4' />
                  ) : (
                    <Eye aria-hidden='true' className='h-4 w-4' />
                  )}
                </button>
              </div>
              <Button type='button' onClick={handleSavePassword} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save password'}
              </Button>
            </div>
            <p className='font-mono text-[0.58rem] text-foreground/45 tracking-wider'>
              Pick something easy for guests to remember and for you to share.
              {initialIsPasswordEnabled
                ? ' Saving a new password replaces the old one for everyone.'
                : ''}
            </p>
          </div>
        ) : (
          <p className='font-sans text-muted-foreground text-sm'>
            Anyone with the link can currently view your site.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
