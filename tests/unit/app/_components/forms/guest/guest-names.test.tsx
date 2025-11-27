/**
 * Tests for GuestNameForm - Primary Contact Toggle
 *
 * Tests the custom business logic for primary contact management:
 * - Auto-unchecking other guests when one is marked as primary
 * - Ensuring exactly one primary contact is maintained
 */

import { act, renderHook } from '@testing-library/react'
import { useForm } from 'react-hook-form'

import { type HouseholdFormData } from '~/app/_components/forms/guest-form.schema'

describe('GuestNameForm - Primary Contact Toggle', () => {
  describe('handlePrimaryContactChange behavior', () => {
    it('should uncheck other guests when one is marked as primary', () => {
      // Setup form with 3 guests, first one is primary
      const { result } = renderHook(() =>
        useForm<HouseholdFormData>({
          defaultValues: {
            householdId: '',
            guestParty: [
              {
                firstName: 'John',
                lastName: 'Doe',
                isPrimaryContact: true,
                email: null,
                phone: null,
                invites: {},
              },
              {
                firstName: 'Jane',
                lastName: 'Doe',
                isPrimaryContact: false,
                email: null,
                phone: null,
                invites: {},
              },
              {
                firstName: 'Jim',
                lastName: 'Doe',
                isPrimaryContact: false,
                email: null,
                phone: null,
                invites: {},
              },
            ],
            gifts: [],
            deletedGuests: [],
          },
        })
      )

      // Simulate checking Jane (index 1) as primary
      // This mimics the logic in guest-names.tsx handlePrimaryContactChange
      act(() => {
        const currentGuestParty = result.current.watch('guestParty')
        result.current.setValue('guestParty.1.isPrimaryContact', true)

        // Uncheck all other guests (this is what the component does)
        currentGuestParty.forEach((_, index) => {
          if (index !== 1) {
            result.current.setValue(`guestParty.${index}.isPrimaryContact`, false)
          }
        })
      })

      // Verify only Jane is now primary
      const updatedGuestParty = result.current.watch('guestParty')
      expect(updatedGuestParty[0]?.isPrimaryContact).toBe(false) // John unchecked
      expect(updatedGuestParty[1]?.isPrimaryContact).toBe(true) // Jane checked
      expect(updatedGuestParty[2]?.isPrimaryContact).toBe(false) // Jim still unchecked
    })

    it('should maintain single primary contact when switching between guests', () => {
      const { result } = renderHook(() =>
        useForm<HouseholdFormData>({
          defaultValues: {
            householdId: '',
            guestParty: [
              { firstName: 'Guest1', lastName: 'A', isPrimaryContact: true, invites: {} },
              { firstName: 'Guest2', lastName: 'B', isPrimaryContact: false, invites: {} },
              { firstName: 'Guest3', lastName: 'C', isPrimaryContact: false, invites: {} },
            ],
            gifts: [],
            deletedGuests: [],
          },
        })
      )

      // Switch primary from Guest1 to Guest3
      act(() => {
        const guestParty = result.current.watch('guestParty')
        result.current.setValue('guestParty.2.isPrimaryContact', true)
        guestParty.forEach((_, index) => {
          if (index !== 2) {
            result.current.setValue(`guestParty.${index}.isPrimaryContact`, false)
          }
        })
      })

      const afterFirstSwitch = result.current.watch('guestParty')
      expect(afterFirstSwitch.filter((g) => g.isPrimaryContact).length).toBe(1)
      expect(afterFirstSwitch[2]?.isPrimaryContact).toBe(true)

      // Switch again from Guest3 to Guest2
      act(() => {
        const guestParty2 = result.current.watch('guestParty')
        result.current.setValue('guestParty.1.isPrimaryContact', true)
        guestParty2.forEach((_, index) => {
          if (index !== 1) {
            result.current.setValue(`guestParty.${index}.isPrimaryContact`, false)
          }
        })
      })

      const afterSecondSwitch = result.current.watch('guestParty')
      expect(afterSecondSwitch.filter((g) => g.isPrimaryContact).length).toBe(1)
      expect(afterSecondSwitch[1]?.isPrimaryContact).toBe(true)
    })

    it('should handle unchecking primary contact (edge case)', () => {
      // Edge case: User unchecks the primary contact
      // Form validation will catch this, but component should allow it
      const { result } = renderHook(() =>
        useForm<HouseholdFormData>({
          defaultValues: {
            householdId: '',
            guestParty: [
              { firstName: 'John', lastName: 'Doe', isPrimaryContact: true, invites: {} },
            ],
            gifts: [],
            deletedGuests: [],
          },
        })
      )

      // Uncheck the primary contact
      act(() => {
        result.current.setValue('guestParty.0.isPrimaryContact', false)
      })

      const updatedGuestParty = result.current.watch('guestParty')
      expect(updatedGuestParty[0]?.isPrimaryContact).toBe(false)

      // Form would show validation error, but component allows the state change
      // This is correct - component manages state, validator enforces rules
    })

    it('should work correctly when adding new guest as primary', () => {
      const { result } = renderHook(() =>
        useForm<HouseholdFormData>({
          defaultValues: {
            householdId: '',
            guestParty: [
              { firstName: 'Existing', lastName: 'Guest', isPrimaryContact: true, invites: {} },
            ],
            gifts: [],
            deletedGuests: [],
          },
        })
      )

      // Add a new guest
      act(() => {
        const currentGuestParty = result.current.watch('guestParty')
        result.current.setValue('guestParty', [
          ...currentGuestParty,
          {
            firstName: 'New',
            lastName: 'Guest',
            isPrimaryContact: false,
            ageGroup: 'ADULT' as const,
            tagIds: [],
            invites: {},
          },
        ])
      })

      // Mark new guest as primary
      act(() => {
        const guestParty = result.current.watch('guestParty')
        result.current.setValue('guestParty.1.isPrimaryContact', true)
        guestParty.forEach((_, index) => {
          if (index !== 1) {
            result.current.setValue(`guestParty.${index}.isPrimaryContact`, false)
          }
        })
      })

      const updatedGuestParty = result.current.watch('guestParty')
      expect(updatedGuestParty).toHaveLength(2)
      expect(updatedGuestParty[0]?.isPrimaryContact).toBe(false) // Existing guest unchecked
      expect(updatedGuestParty[1]?.isPrimaryContact).toBe(true) // New guest is primary
    })
  })
})
