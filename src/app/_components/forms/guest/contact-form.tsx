import { type FieldErrors, type UseFormRegister } from 'react-hook-form'

import { type HouseholdFormData } from '~/app/_components/forms/guest-form.schema'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

type ContactFormProps = {
  register: UseFormRegister<HouseholdFormData>
  errors: FieldErrors<HouseholdFormData>
}

export default function ContactForm({ register, errors }: ContactFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="household-address1">Street Address</Label>
        <Input
          id="household-address1"
          {...register('address1')}
          placeholder="123 Main St"
          className={errors.address1 ? 'border-destructive' : ''}
        />
        {errors.address1 && <p className="text-sm text-destructive">{errors.address1.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="household-address2">Apt/Suite/Other</Label>
        <Input
          id="household-address2"
          {...register('address2')}
          placeholder="Apt 4B"
          className={errors.address2 ? 'border-destructive' : ''}
        />
        {errors.address2 && <p className="text-sm text-destructive">{errors.address2.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="household-city">City</Label>
          <Input
            id="household-city"
            {...register('city')}
            placeholder="San Francisco"
            className={errors.city ? 'border-destructive' : ''}
          />
          {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="household-state">State</Label>
          <select
            id="household-state"
            {...register('state')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Select</option>
            <option>AL</option>
            <option>AR</option>
            <option>WY</option>
          </select>
          {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="household-zipCode">Zip Code</Label>
          <Input
            id="household-zipCode"
            {...register('zipCode')}
            placeholder="94102"
            className={errors.zipCode ? 'border-destructive' : ''}
          />
          {errors.zipCode && <p className="text-sm text-destructive">{errors.zipCode.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="household-country">Country</Label>
          <select
            id="household-country"
            {...register('country')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Select</option>
            <option>United States</option>
            <option>Mexico</option>
            <option>Canada</option>
          </select>
          {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
        </div>
      </div>
    </div>
  )
}
