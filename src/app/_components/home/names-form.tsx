'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { z } from 'zod'

import { SignOutButton } from '~/app/_components/auth-buttons'
import { LoadingSpinner } from '~/app/_components/loaders'
import { ThemeToggle } from '~/app/_components/theme-toggle'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Switch } from '~/components/ui/switch'
import { useSession } from '~/lib/auth-client'
import { cn } from '~/lib/utils'
import { createWeddingSchema } from '~/server/domains/wedding/wedding.validator'
import { api } from '~/trpc/react'

type NamesFormData = z.infer<typeof createWeddingSchema>

export default function NamesForm() {
  const { data: session, isPending: isLoading } = useSession()

  const createWedding = api.wedding.create.useMutation({
    onSuccess: () => {
      window.location.href = '/dashboard'
    },
  })

  const form = useForm<NamesFormData>({
    resolver: zodResolver(createWeddingSchema),
    defaultValues: {
      groomFirstName: '',
      groomMiddleName: '',
      groomLastName: '',
      brideFirstName: '',
      brideMiddleName: '',
      brideLastName: '',
      hasWeddingDetails: false,
      weddingLocation: '',
    },
  })

  // Separate state for date picker (uses Date object, converted to string on submit)
  const [weddingDate, setWeddingDate] = useState<Date | undefined>(undefined)

  const { register, handleSubmit, formState, control, watch } = form
  const { errors, isSubmitting } = formState
  const hasWeddingDetails = watch('hasWeddingDetails')

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!session) {
    return null
  }

  return (
    <main>
      <div className="flex items-center justify-between bg-pink-300 p-4">
        <h1>{session.user?.name ?? session.user?.email}</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </div>
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Welcome, Lovebirds! 💕</CardTitle>
            <CardDescription>
              Let&apos;s get started by adding your names to create your wedding plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {createWedding.isPending && (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner />
              </div>
            )}
            {createWedding.isError && (
              <div className="bg-destructive/10 mb-4 rounded-lg border border-destructive p-4 text-destructive">
                <p className="font-semibold">Error creating wedding</p>
                <p className="text-sm">{createWedding.error?.message ?? 'Please try again'}</p>
              </div>
            )}
            <form
              onSubmit={handleSubmit((data) => {
                createWedding.mutate({
                  ...data,
                  weddingDate: weddingDate?.toISOString(), // Convert Date to string
                })
              })}
              className="space-y-8"
            >
              {/* Groom and Bride Sections */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Groom's Section */}
                <div className="bg-muted/50 space-y-4 rounded-lg border p-6">
                  <h3 className="text-lg font-semibold">Groom&apos;s Information</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="groomFirstName">First Name</Label>
                      <Input
                        id="groomFirstName"
                        placeholder="Enter first name"
                        {...register('groomFirstName')}
                        disabled={isSubmitting}
                      />
                      {errors.groomFirstName && (
                        <p className="text-sm text-destructive">{errors.groomFirstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="groomMiddleName">Middle Name (Optional)</Label>
                      <Input
                        id="groomMiddleName"
                        placeholder="Enter middle name"
                        {...register('groomMiddleName')}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="groomLastName">Last Name</Label>
                      <Input
                        id="groomLastName"
                        placeholder="Enter last name"
                        {...register('groomLastName')}
                        disabled={isSubmitting}
                      />
                      {errors.groomLastName && (
                        <p className="text-sm text-destructive">{errors.groomLastName.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bride's Section */}
                <div className="bg-muted/50 space-y-4 rounded-lg border p-6">
                  <h3 className="text-lg font-semibold">Bride&apos;s Information</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="brideFirstName">First Name</Label>
                      <Input
                        id="brideFirstName"
                        placeholder="Enter first name"
                        {...register('brideFirstName')}
                        disabled={isSubmitting}
                      />
                      {errors.brideFirstName && (
                        <p className="text-sm text-destructive">{errors.brideFirstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brideMiddleName">Middle Name (Optional)</Label>
                      <Input
                        id="brideMiddleName"
                        placeholder="Enter middle name"
                        {...register('brideMiddleName')}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brideLastName">Last Name</Label>
                      <Input
                        id="brideLastName"
                        placeholder="Enter last name"
                        {...register('brideLastName')}
                        disabled={isSubmitting}
                      />
                      {errors.brideLastName && (
                        <p className="text-sm text-destructive">{errors.brideLastName.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Wedding Details Toggle */}
              <div className="bg-muted/50 flex items-center justify-between rounded-lg border p-6">
                <div className="space-y-0.5">
                  <Label htmlFor="wedding-details-toggle" className="text-base">
                    Do you have a wedding date and location?
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    You can add this information now or later from your dashboard
                  </p>
                </div>
                <Controller
                  name="hasWeddingDetails"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="wedding-details-toggle"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </div>

              {/* Wedding Details Section (Conditional) */}
              {hasWeddingDetails && (
                <div className="bg-muted/50 space-y-4 rounded-lg border p-6">
                  <h3 className="text-lg font-semibold">Wedding Details</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Wedding Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !weddingDate && 'text-muted-foreground'
                            )}
                            disabled={isSubmitting}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {weddingDate ? (
                              weddingDate.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={weddingDate}
                            onSelect={setWeddingDate}
                            captionLayout="dropdown"
                            startMonth={new Date()}
                            endMonth={new Date(new Date().getFullYear() + 10, 11)}
                            autoFocus
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weddingLocation">Wedding Location</Label>
                      <Input
                        id="weddingLocation"
                        placeholder="e.g., Beach Resort, Cabo"
                        {...register('weddingLocation')}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
                {isSubmitting ? 'Creating...' : 'Create Our Website!'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
