import { fireEvent, render, screen } from '@testing-library/react'

import { VendorCustomFields } from '~/components/vendor/vendor-custom-fields'

describe('VendorCustomFields', () => {
  it('persists booleans as true/false strings and numeric values as strings', () => {
    const onSave = jest.fn()

    render(
      <VendorCustomFields
        definitions={[
          { key: 'allows_sparklers', label: 'Allows Sparklers', type: 'boolean', displayOrder: 0 },
          { key: 'guest_minimum', label: 'Guest Minimum', type: 'number', displayOrder: 1 },
        ]}
        values={{ guest_minimum: '80', allows_sparklers: 'false' }}
        onSave={onSave}
        isSaving={false}
      />
    )

    fireEvent.click(screen.getByRole('checkbox', { name: /allows sparklers/i }))
    fireEvent.change(screen.getByLabelText(/guest minimum/i), { target: { value: '125' } })
    fireEvent.click(screen.getByRole('button', { name: /save custom fields/i }))

    expect(onSave).toHaveBeenCalledWith({
      allows_sparklers: 'true',
      guest_minimum: '125',
    })
  })
})
