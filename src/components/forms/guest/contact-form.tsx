import type { FieldErrors, UseFormRegister } from 'react-hook-form'

import type { HouseholdFormData } from '~/components/forms/guest-form.schema'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

type ContactFormProps = {
  register: UseFormRegister<HouseholdFormData>
  errors: FieldErrors<HouseholdFormData>
}

export default function ContactForm({ register, errors }: ContactFormProps) {
  return (
    <div className='space-y-4'>
      <p className='text-muted-foreground text-xs'>
        Used for posting save the dates, invitations, and thank you cards.
      </p>

      <div className='space-y-2'>
        <Label htmlFor='household-address1'>Street Address</Label>
        <Input
          id='household-address1'
          {...register('address1')}
          placeholder='123 Main St'
          className={errors.address1 ? 'border-destructive' : ''}
        />
        {errors.address1 && <p className='text-destructive text-sm'>{errors.address1.message}</p>}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='household-address2'>Apt / Suite / Other</Label>
        <Input
          id='household-address2'
          {...register('address2')}
          placeholder='Apt 4B'
          className={errors.address2 ? 'border-destructive' : ''}
        />
        {errors.address2 && <p className='text-destructive text-sm'>{errors.address2.message}</p>}
      </div>

      <div className='grid gap-4 sm:grid-cols-3'>
        <div className='space-y-2 sm:col-span-2'>
          <Label htmlFor='household-city'>City</Label>
          <Input
            id='household-city'
            {...register('city')}
            placeholder='San Francisco'
            className={errors.city ? 'border-destructive' : ''}
          />
          {errors.city && <p className='text-destructive text-sm'>{errors.city.message}</p>}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='household-state'>State / Province</Label>
          <Input
            id='household-state'
            {...register('state')}
            placeholder='CA'
            className={errors.state ? 'border-destructive' : ''}
          />
          {errors.state && <p className='text-destructive text-sm'>{errors.state.message}</p>}
        </div>
      </div>

      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='household-zipCode'>Zip / Postal Code</Label>
          <Input
            id='household-zipCode'
            {...register('zipCode')}
            placeholder='94102'
            className={errors.zipCode ? 'border-destructive' : ''}
          />
          {errors.zipCode && <p className='text-destructive text-sm'>{errors.zipCode.message}</p>}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='household-country'>Country</Label>
          <Input
            id='household-country'
            {...register('country')}
            placeholder='United States'
            className={errors.country ? 'border-destructive' : ''}
          />
          {errors.country && <p className='text-destructive text-sm'>{errors.country.message}</p>}
        </div>
      </div>
    </div>
  )
}
