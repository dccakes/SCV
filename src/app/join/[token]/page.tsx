'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { api } from '~/trpc/react'

const selfFillFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Please enter a valid email').or(z.literal('')).optional(),
  phone: z.string().max(20).optional(),
})

type SelfFillFormData = z.infer<typeof selfFillFormSchema>

export default function SelfFillPage() {
  const params = useParams()
  const token = params.token as string
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const { data: wedding, isLoading: isLoadingWedding } = api.selfFill.getByToken.useQuery(
    { token },
    { enabled: !!token }
  )

  const registerMutation = api.selfFill.registerGuest.useMutation({
    onSuccess: (data) => {
      setSuccessMessage(data.message)
      setIsSubmitted(true)
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SelfFillFormData>({
    resolver: zodResolver(selfFillFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
  })

  const onSubmit = async (data: SelfFillFormData) => {
    await registerMutation.mutateAsync({
      token,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      phone: data.phone || null,
    })
  }

  if (isLoadingWedding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-rose-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    )
  }

  if (!wedding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-rose-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-rose-700">Link Not Found</CardTitle>
            <CardDescription>
              This registration link is invalid or has expired. Please contact the couple for a new
              link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-rose-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">You&apos;re on the list!</CardTitle>
            <CardDescription className="text-base">{successMessage}</CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            <p>
              {wedding.groomFirstName} & {wedding.brideFirstName} will be in touch with more
              details.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-rose-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-rose-700">
            {wedding.groomFirstName} & {wedding.brideFirstName}&apos;s Wedding
          </CardTitle>
          <CardDescription>
            Add yourself to the guest list by filling out the form below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...register('firstName')}
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...register('lastName')}
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 234 567 8900"
                {...register('phone')}
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
            </div>

            {registerMutation.error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {registerMutation.error.message}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-700"
              disabled={isSubmitting || registerMutation.isPending}
            >
              {isSubmitting || registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Me to the Guest List'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
