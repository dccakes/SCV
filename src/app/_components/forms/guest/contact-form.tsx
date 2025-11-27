import { type FieldErrors, type UseFormRegister } from 'react-hook-form'

import { type HouseholdFormData } from '~/app/_components/forms/guest-form.schema'

type ContactFormProps = {
  register: UseFormRegister<HouseholdFormData>
  errors: FieldErrors<HouseholdFormData>
}

export default function ContactForm({ register, errors }: ContactFormProps) {
  return (
    <div className="grid grid-cols-1 gap-3">
      <div>
        <div className="relative">
          <input
            id="household-address1"
            {...register('address1')}
            className={`peer w-full rounded-lg border p-3 ${
              errors.address1 ? 'border-red-500' : 'border-gray-300'
            } focus:border-blue-500 focus:outline-none`}
            placeholder=" "
          />
          <label
            htmlFor="household-address1"
            className="absolute left-3 top-3 -translate-y-6 transform bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-base peer-focus:-translate-y-6 peer-focus:text-sm peer-focus:text-blue-500"
          >
            Street Address
          </label>
        </div>
        {errors.address1 && <p className="mt-1 text-sm text-red-600">{errors.address1.message}</p>}
      </div>

      <div>
        <div className="relative">
          <input
            id="household-address2"
            {...register('address2')}
            className={`peer w-full rounded-lg border p-3 ${
              errors.address2 ? 'border-red-500' : 'border-gray-300'
            } focus:border-blue-500 focus:outline-none`}
            placeholder=" "
          />
          <label
            htmlFor="household-address2"
            className="absolute left-3 top-3 -translate-y-6 transform bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-base peer-focus:-translate-y-6 peer-focus:text-sm peer-focus:text-blue-500"
          >
            Apt/Suite/Other
          </label>
        </div>
        {errors.address2 && <p className="mt-1 text-sm text-red-600">{errors.address2.message}</p>}
      </div>

      <div className="flex gap-3">
        <div className="w-1/2">
          <div className="relative">
            <input
              id="household-city"
              {...register('city')}
              className={`peer w-full rounded-lg border p-3 ${
                errors.city ? 'border-red-500' : 'border-gray-300'
              } focus:border-blue-500 focus:outline-none`}
              placeholder=" "
            />
            <label
              htmlFor="household-city"
              className="absolute left-3 top-3 -translate-y-6 transform bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-base peer-focus:-translate-y-6 peer-focus:text-sm peer-focus:text-blue-500"
            >
              City
            </label>
          </div>
          {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
        </div>

        <div className="w-1/4">
          <select {...register('state')} className="w-full rounded-lg border p-3">
            <option value="">State</option>
            <option>AL</option>
            <option>AR</option>
            <option>WY</option>
          </select>
          {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>}
        </div>

        <div className="w-1/4">
          <div className="relative">
            <input
              id="household-zipCode"
              {...register('zipCode')}
              className={`peer w-full rounded-lg border p-3 ${
                errors.zipCode ? 'border-red-500' : 'border-gray-300'
              } focus:border-blue-500 focus:outline-none`}
              placeholder=" "
            />
            <label
              htmlFor="household-zipCode"
              className="absolute left-3 top-3 -translate-y-6 transform bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-base peer-focus:-translate-y-6 peer-focus:text-sm peer-focus:text-blue-500"
            >
              Zip Code
            </label>
          </div>
          {errors.zipCode && <p className="mt-1 text-sm text-red-600">{errors.zipCode.message}</p>}
        </div>
      </div>

      <div>
        <select {...register('country')} className="w-full rounded-lg border p-3">
          <option value="">Country</option>
          <option>Murca</option>
          <option>Mexico</option>
          <option>Canada</option>
        </select>
        {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>}
      </div>
      {/* Note: Phone and email are now on individual Guests, not Household */}
    </div>
  )
}
