'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { PhoneInput } from '~/components/ui/phone-input'
import { optionalPhoneSchema } from '~/lib/phone/phone-validator'
import { api } from '~/trpc/react'

type SelfFillFormData = {
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  address1?: string
  address2?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}

export default function SelfFillPage() {
  const t = useTranslations('join')
  const params = useParams()
  const token = params.token as string
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const selfFillFormSchema = z.object({
    firstName: z.string().min(1, t('firstNameRequired')).max(100),
    lastName: z.string().min(1, t('lastNameRequired')).max(100),
    email: z.string().trim().min(1, t('emailRequired')).email(t('emailInvalid')),
    phone: optionalPhoneSchema,
    address1: z.string().trim().max(200).optional(),
    address2: z.string().trim().max(200).optional(),
    city: z.string().trim().max(100).optional(),
    state: z.string().trim().max(100).optional(),
    zipCode: z.string().trim().max(20).optional(),
    country: z.string().trim().max(100).optional(),
  })

  const { data: wedding, isLoading: isLoadingWedding } = api.selfFill.getByToken.useQuery(
    { token },
    { enabled: !!token }
  )

  const [mutationError, setMutationError] = useState<string | null>(null)

  const registerMutation = api.selfFill.registerGuest.useMutation({
    onSuccess: (data) => {
      setSuccessMessage(data.message)
      setIsSubmitted(true)
      setMutationError(null)
    },
    onError: (error) => {
      // Map known error codes to user-friendly messages
      if (error.data?.code === 'NOT_FOUND') {
        setMutationError(t('errorInvalidLink'))
      } else if (error.data?.code === 'CONFLICT') {
        setMutationError(t('errorAlreadyRegistered'))
      } else {
        setMutationError(t('errorGeneric'))
      }
    },
  })

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SelfFillFormData>({
    resolver: zodResolver(selfFillFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
  })

  const onSubmit = async (data: SelfFillFormData) => {
    await registerMutation.mutateAsync({
      token,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone ?? null,
      address1: data.address1 ?? null,
      address2: data.address2 ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
      zipCode: data.zipCode ?? null,
      country: data.country ?? null,
    })
  }

  if (isLoadingWedding) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-background'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    )
  }

  if (!wedding) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-background p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <CardTitle className='text-2xl'>{t('linkNotFound')}</CardTitle>
            <CardDescription>{t('linkNotFoundDescription')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-background p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10'>
              <CheckCircle2 className='h-10 w-10 text-success' />
            </div>
            <CardTitle className='text-2xl text-success'>{t('successTitle')}</CardTitle>
            <CardDescription className='text-base'>{successMessage}</CardDescription>
          </CardHeader>
          <CardContent className='text-center text-muted-foreground text-sm'>
            <p>
              {t('successNote', {
                groomFirstName: wedding.groomFirstName,
                brideFirstName: wedding.brideFirstName,
              })}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-background p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl text-primary'>
            {t('title', {
              groomFirstName: wedding.groomFirstName,
              brideFirstName: wedding.brideFirstName,
            })}
          </CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            {/* Name */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='firstName'>{`${t('firstName')} *`}</Label>
                <Input
                  id='firstName'
                  placeholder='John'
                  {...register('firstName')}
                  className={errors.firstName ? 'border-destructive' : ''}
                />
                {errors.firstName && (
                  <p className='text-destructive text-sm'>{errors.firstName.message}</p>
                )}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='lastName'>{`${t('lastName')} *`}</Label>
                <Input
                  id='lastName'
                  placeholder='Doe'
                  {...register('lastName')}
                  className={errors.lastName ? 'border-destructive' : ''}
                />
                {errors.lastName && (
                  <p className='text-destructive text-sm'>{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Contact */}
            <div className='space-y-2'>
              <Label htmlFor='email'>{`${t('email')} *`}</Label>
              <Input
                id='email'
                type='email'
                placeholder='john@example.com'
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className='text-destructive text-sm'>{errors.email.message}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='phone'>{t('phone')}</Label>
              <Controller
                name='phone'
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    id='phone'
                    value={field.value}
                    onChange={(nextValue) => field.onChange(nextValue ?? null)}
                    placeholder='+1 234 567 8900'
                    error={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? 'phone-error' : undefined}
                  />
                )}
              />
              {errors.phone && (
                <p id='phone-error' className='text-destructive text-sm'>
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Mailing Address */}
            <div className='space-y-4'>
              <div>
                <p className='font-medium text-sm'>{t('mailingAddress')}</p>
                <p className='text-muted-foreground text-xs'>{t('mailingAddressNote')}</p>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='address1'>{t('streetAddress')}</Label>
                <Input
                  id='address1'
                  placeholder='123 Main St'
                  {...register('address1')}
                  className={errors.address1 ? 'border-destructive' : ''}
                />
                {errors.address1 && (
                  <p className='text-destructive text-sm'>{errors.address1.message}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='address2'>{t('aptSuite')}</Label>
                <Input
                  id='address2'
                  placeholder='Apt 4B'
                  {...register('address2')}
                  className={errors.address2 ? 'border-destructive' : ''}
                />
                {errors.address2 && (
                  <p className='text-destructive text-sm'>{errors.address2.message}</p>
                )}
              </div>

              <div className='grid grid-cols-3 gap-4'>
                <div className='col-span-2 space-y-2'>
                  <Label htmlFor='city'>{t('city')}</Label>
                  <Input
                    id='city'
                    placeholder='San Francisco'
                    {...register('city')}
                    className={errors.city ? 'border-destructive' : ''}
                  />
                  {errors.city && <p className='text-destructive text-sm'>{errors.city.message}</p>}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='state'>{t('state')}</Label>
                  <Input
                    id='state'
                    placeholder='CA'
                    {...register('state')}
                    className={errors.state ? 'border-destructive' : ''}
                  />
                  {errors.state && (
                    <p className='text-destructive text-sm'>{errors.state.message}</p>
                  )}
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='zipCode'>{t('zipCode')}</Label>
                  <Input
                    id='zipCode'
                    placeholder='94102'
                    {...register('zipCode')}
                    className={errors.zipCode ? 'border-destructive' : ''}
                  />
                  {errors.zipCode && (
                    <p className='text-destructive text-sm'>{errors.zipCode.message}</p>
                  )}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='country'>{t('country')}</Label>
                  <Input
                    id='country'
                    placeholder='United States'
                    {...register('country')}
                    className={errors.country ? 'border-destructive' : ''}
                  />
                  {errors.country && (
                    <p className='text-destructive text-sm'>{errors.country.message}</p>
                  )}
                </div>
              </div>
            </div>

            {mutationError && (
              <div className='rounded-md bg-destructive/10 p-3 text-destructive text-sm'>
                {mutationError}
              </div>
            )}

            <Button
              type='submit'
              className='w-full'
              disabled={isSubmitting || registerMutation.isPending}
            >
              {isSubmitting || registerMutation.isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {t('adding')}
                </>
              ) : (
                t('addToList')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
