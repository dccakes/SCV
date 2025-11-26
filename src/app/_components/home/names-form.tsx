'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { z } from 'zod'

import { SignOutButton } from '~/app/_components/auth-buttons'
import { LoadingSpinner } from '~/app/_components/loaders'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Switch } from '~/components/ui/switch'
import { useSession } from '~/lib/auth-client'
import { cn } from '~/lib/utils'
import { createWebsiteSchema } from '~/server/domains/website/website.validator'
import { api } from '~/trpc/react'

type NamesFormData = z.infer<typeof createWebsiteSchema>

export default function NamesForm() {
  const { data: session, isPending: isLoading } = useSession()

  const createWebsite = api.website.create.useMutation({
    onSuccess: () => (window.location.href = '/dashboard'),
  })

  const form = useForm<NamesFormData>({
    resolver: zodResolver(createWebsiteSchema),
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      partnerFirstName: '',
      partnerMiddleName: '',
      partnerLastName: '',
      basePath: '',
      email: '',
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
      <div className="flex justify-between bg-pink-300 p-4">
        <h1>{session.user?.name ?? session.user?.email}</h1>
        <SignOutButton />
      </div>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Welcome, Lovebirds! 💕</CardTitle>
            <CardDescription>
              Let&apos;s get started by adding your names to create your wedding website
            </CardDescription>
          </CardHeader>
          <CardContent>
            {createWebsite.isPending && (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner />
              </div>
            )}
            <form
              onSubmit={handleSubmit((data) => {
                createWebsite.mutate({
                  firstName: data.firstName,
                  middleName: data.middleName,
                  lastName: data.lastName,
                  partnerFirstName: data.partnerFirstName,
                  partnerMiddleName: data.partnerMiddleName,
                  partnerLastName: data.partnerLastName,
                  basePath: window.location.origin,
                  email: session.user?.email ?? '',
                  hasWeddingDetails: data.hasWeddingDetails,
                  weddingDate: weddingDate?.toISOString(), // Convert Date to string
                  weddingLocation: data.weddingLocation,
                })
              })}
              className="space-y-8"
            >
              {/* Groom and Bride Sections */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Groom's Section */}
                <div className="space-y-4 rounded-lg border bg-slate-50 p-6">
                  <h3 className="text-lg font-semibold text-slate-900">Groom&apos;s Information</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="Enter first name"
                        {...register('firstName')}
                        disabled={isSubmitting}
                      />
                      {errors.firstName && (
                        <p className="text-sm text-destructive">{errors.firstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="middleName">Middle Name (Optional)</Label>
                      <Input
                        id="middleName"
                        placeholder="Enter middle name"
                        {...register('middleName')}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Enter last name"
                        {...register('lastName')}
                        disabled={isSubmitting}
                      />
                      {errors.lastName && (
                        <p className="text-sm text-destructive">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bride's Section */}
                <div className="space-y-4 rounded-lg border bg-slate-50 p-6">
                  <h3 className="text-lg font-semibold text-slate-900">Bride&apos;s Information</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="partnerFirstName">First Name</Label>
                      <Input
                        id="partnerFirstName"
                        placeholder="Enter first name"
                        {...register('partnerFirstName')}
                        disabled={isSubmitting}
                      />
                      {errors.partnerFirstName && (
                        <p className="text-sm text-destructive">
                          {errors.partnerFirstName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="partnerMiddleName">Middle Name (Optional)</Label>
                      <Input
                        id="partnerMiddleName"
                        placeholder="Enter middle name"
                        {...register('partnerMiddleName')}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="partnerLastName">Last Name</Label>
                      <Input
                        id="partnerLastName"
                        placeholder="Enter last name"
                        {...register('partnerLastName')}
                        disabled={isSubmitting}
                      />
                      {errors.partnerLastName && (
                        <p className="text-sm text-destructive">{errors.partnerLastName.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Wedding Details Toggle */}
              <div className="flex items-center justify-between rounded-lg border bg-slate-50 p-6">
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
                <div className="space-y-4 rounded-lg border bg-slate-50 p-6">
                  <h3 className="text-lg font-semibold text-slate-900">Wedding Details</h3>
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
