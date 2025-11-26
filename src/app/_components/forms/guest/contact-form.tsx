import AnimatedInputLabel from '~/app/_components/forms/animated-input-label'
import { type HouseholdFormData } from '~/app/utils/shared-types'

type ContactFormProps = {
  householdFormData: HouseholdFormData
  handleOnChange: ({ field, inputValue }: { field: string; inputValue: string }) => void
}

export default function ContactForm({ householdFormData, handleOnChange }: ContactFormProps) {
  return (
    <div className="grid grid-cols-1 grid-rows-[repeat(5,50px)] gap-3">
      <AnimatedInputLabel
        id="household-address1"
        inputValue={householdFormData.address1 ?? ''}
        fieldName="address1"
        labelText="Street Address"
        handleOnChange={handleOnChange}
      />
      <AnimatedInputLabel
        id="household-address2"
        inputValue={householdFormData.address2 ?? ''}
        fieldName="address2"
        labelText="Apt/Suite/Other"
        handleOnChange={handleOnChange}
      />

      <div className="flex gap-3">
        <div className="w-1/2">
          <AnimatedInputLabel
            id="household-city"
            inputValue={householdFormData.city ?? ''}
            fieldName="city"
            labelText="City"
            handleOnChange={handleOnChange}
          />
        </div>
        <select
          value={householdFormData.state}
          onChange={(e) => handleOnChange({ field: 'state', inputValue: e.target.value })}
          className="w-1/4 rounded-lg border p-3"
        >
          <option defaultValue="State">State</option>
          <option>AL</option>
          <option>AR</option>
          <option>WY</option>
        </select>
        <div className="w-1/4">
          <AnimatedInputLabel
            id="household-zipCode"
            inputValue={householdFormData.zipCode ?? ''}
            fieldName="zipCode"
            labelText="Zip Code"
            handleOnChange={handleOnChange}
          />
        </div>
      </div>
      <select
        className="w-100 rounded-lg border p-3"
        value={householdFormData.country}
        onChange={(e) => handleOnChange({ field: 'country', inputValue: e.target.value })}
      >
        <option defaultValue="State">Country</option>
        <option>Murca</option>
        <option>Mexico</option>
        <option>Canada</option>
      </select>
      {/* Note: Phone and email are now on individual Guests, not Household */}
    </div>
  )
}
