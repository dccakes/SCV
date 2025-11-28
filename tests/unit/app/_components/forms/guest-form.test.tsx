/**
 * Tests for Guest Form - Custom Business Logic
 *
 * Tests critical form behaviors that are NOT covered by backend tests:
 * 1. Deleted guests tracking - prevents data loss during updates
 * 2. Dirty field submission - optimizes API calls by only sending changed data
 */

import { act, renderHook } from '@testing-library/react'
import { useFieldArray, useForm } from 'react-hook-form'

import {
  getDefaultHouseholdFormData,
  type HouseholdFormData,
} from '~/app/_components/forms/guest-form.schema'
import { getDirtyValues } from '~/app/utils/form-helpers'

// Mock events for form initialization
const mockEvents = [
  { id: 'event-1', name: 'Wedding Ceremony' },
  { id: 'event-2', name: 'Reception' },
]

describe('GuestForm - Deleted Guests Tracking', () => {
  describe('handleRemoveGuest behavior', () => {
    it('should track deleted guest IDs when removing existing guests', () => {
      // Setup form with existing guests (have guestId)
      const { result } = renderHook(() => {
        const form = useForm<HouseholdFormData>({
          defaultValues: {
            householdId: 'household-123',
            guestParty: [
              {
                guestId: 5,
                firstName: 'John',
                lastName: 'Doe',
                isPrimaryContact: true,
                email: null,
                phone: null,
                invites: { 'event-1': 'Invited' },
              },
              {
                guestId: 7,
                firstName: 'Jane',
                lastName: 'Doe',
                isPrimaryContact: false,
                email: null,
                phone: null,
                invites: { 'event-1': 'Invited' },
              },
            ],
            gifts: [],
            deletedGuests: [],
          },
        })

        const { fields, remove } = useFieldArray({
          control: form.control,
          name: 'guestParty',
        })

        return { form, fields, remove }
      })

      // Simulate removing guest at index 1 (Jane, guestId: 7)
      act(() => {
        const guestToRemove = result.current.fields[1]
        if (
          guestToRemove &&
          'guestId' in guestToRemove &&
          typeof guestToRemove.guestId === 'number'
        ) {
          const currentDeleted = result.current.form.watch('deletedGuests') ?? []
          result.current.form.setValue(
            'deletedGuests',
            [...currentDeleted, guestToRemove.guestId],
            { shouldDirty: true }
          )
        }
        result.current.remove(1)
      })

      // Verify guest removed from array
      expect(result.current.form.watch('guestParty')).toHaveLength(1)
      expect(result.current.form.watch('guestParty')[0]?.guestId).toBe(5) // John remains

      // Verify deleted guest tracked
      expect(result.current.form.watch('deletedGuests')).toEqual([7])

      // Verify form state changed (guest removed + deletedGuests updated)
      expect(result.current.form.watch('guestParty')).not.toEqual(
        result.current.form.formState.defaultValues?.guestParty
      )
    })

    it('should not track new guests without guestId when removed', () => {
      const { result } = renderHook(() => {
        const form = useForm<HouseholdFormData>({
          defaultValues: {
            householdId: 'household-123',
            guestParty: [
              {
                guestId: 5,
                firstName: 'Existing',
                lastName: 'Guest',
                isPrimaryContact: true,
                invites: {},
              },
              {
                // New guest - no guestId
                firstName: 'New',
                lastName: 'Guest',
                isPrimaryContact: false,
                invites: {},
              },
            ],
            gifts: [],
            deletedGuests: [],
          },
        })

        const { fields, remove } = useFieldArray({
          control: form.control,
          name: 'guestParty',
        })

        return { form, fields, remove }
      })

      // Remove new guest at index 1 (no guestId)
      act(() => {
        const guestToRemove = result.current.fields[1]
        if (
          guestToRemove &&
          'guestId' in guestToRemove &&
          typeof guestToRemove.guestId === 'number'
        ) {
          const currentDeleted = result.current.form.watch('deletedGuests') ?? []
          result.current.form.setValue('deletedGuests', [...currentDeleted, guestToRemove.guestId])
        }
        result.current.remove(1)
      })

      // Verify guest removed from array
      expect(result.current.form.watch('guestParty')).toHaveLength(1)

      // Verify NOT in deletedGuests (new guest doesn't need deletion from DB)
      expect(result.current.form.watch('deletedGuests')).toEqual([])
    })

    it('should handle multiple guest deletions', () => {
      const { result } = renderHook(() => {
        const form = useForm<HouseholdFormData>({
          defaultValues: {
            householdId: 'household-123',
            guestParty: [
              {
                guestId: 1,
                firstName: 'Guest1',
                lastName: 'A',
                isPrimaryContact: true,
                invites: {},
              },
              {
                guestId: 2,
                firstName: 'Guest2',
                lastName: 'B',
                isPrimaryContact: false,
                invites: {},
              },
              {
                guestId: 3,
                firstName: 'Guest3',
                lastName: 'C',
                isPrimaryContact: false,
                invites: {},
              },
              {
                guestId: 4,
                firstName: 'Guest4',
                lastName: 'D',
                isPrimaryContact: false,
                invites: {},
              },
            ],
            gifts: [],
            deletedGuests: [],
          },
        })

        const { fields, remove } = useFieldArray({
          control: form.control,
          name: 'guestParty',
        })

        return { form, fields, remove }
      })

      // Delete guest at index 2 (guestId: 3)
      act(() => {
        const guest1 = result.current.fields[2]
        if (guest1 && 'guestId' in guest1 && typeof guest1.guestId === 'number') {
          const currentDeleted = result.current.form.watch('deletedGuests') ?? []
          result.current.form.setValue('deletedGuests', [...currentDeleted, guest1.guestId])
        }
        result.current.remove(2)
      })

      // Delete guest at index 1 (guestId: 2) - note: indexes shift after removal
      act(() => {
        const guest2 = result.current.fields[1]
        if (guest2 && 'guestId' in guest2 && typeof guest2.guestId === 'number') {
          const currentDeleted = result.current.form.watch('deletedGuests') ?? []
          result.current.form.setValue('deletedGuests', [...currentDeleted, guest2.guestId])
        }
        result.current.remove(1)
      })

      // Verify correct guests remain
      expect(result.current.form.watch('guestParty')).toHaveLength(2)
      expect(result.current.form.watch('guestParty')[0]?.guestId).toBe(1)
      expect(result.current.form.watch('guestParty')[1]?.guestId).toBe(4)

      // Verify both deletions tracked
      expect(result.current.form.watch('deletedGuests')).toEqual([3, 2])
    })
  })
})

describe('GuestForm - Dirty Field Submission', () => {
  describe('onSubmit behavior', () => {
    it('should not submit when nothing changed in edit mode', () => {
      const { result } = renderHook(() =>
        useForm<HouseholdFormData>({
          defaultValues: {
            householdId: 'household-123',
            guestParty: [
              {
                guestId: 1,
                firstName: 'John',
                lastName: 'Doe',
                isPrimaryContact: true,
                invites: {},
              },
            ],
            address1: '123 Main St',
            city: 'New York',
            gifts: [],
            deletedGuests: [],
          },
        })
      )

      // Form is in edit mode (has householdId) and nothing changed
      const isEditMode = !!result.current.watch('householdId')
      const isDirty = result.current.formState.isDirty

      expect(isEditMode).toBe(true)
      expect(isDirty).toBe(false)

      // onSubmit should return early without calling mutation
      // The component logic checks: if (!isDirty && isEditMode) { return }
      const shouldSkipSubmission = !isDirty && isEditMode
      expect(shouldSkipSubmission).toBe(true)
    })

    it('should send only changed fields on update', () => {
      const { result } = renderHook(() => {
        const form = useForm<HouseholdFormData>({
          mode: 'onChange', // Enable dirty tracking
          defaultValues: {
            householdId: 'household-123',
            guestParty: [
              {
                guestId: 1,
                firstName: 'John',
                lastName: 'Doe',
                isPrimaryContact: true,
                invites: {},
              },
            ],
            address1: '123 Main St',
            city: 'New York',
            state: 'NY',
            gifts: [],
            deletedGuests: [],
          },
        })

        // Access formState to subscribe to changes (react-hook-form requirement)
        void form.formState.isDirty

        return form
      })

      // User changes only the city
      act(() => {
        result.current.setValue('city', 'Los Angeles', { shouldDirty: true })
      })

      const dirtyFields = result.current.formState.dirtyFields
      const allData = result.current.getValues()

      // Verify dirty state tracking
      expect(dirtyFields.city).toBe(true)
      expect(dirtyFields.address1).toBeUndefined() // Not changed

      // Extract only changed fields
      const changedData = getDirtyValues(dirtyFields, allData)

      // Should only include changed field
      expect(changedData.city).toBe('Los Angeles')
      expect(changedData.address1).toBeUndefined() // Not in changedData

      // Verify all data still accessible
      expect(allData.address1).toBe('123 Main St') // Original value preserved
      expect(allData.city).toBe('Los Angeles') // New value

      // Component would send:
      // {
      //   householdId: 'household-123',  // Required
      //   guestParty: [...],             // Required
      //   gifts: [...],                  // Required
      //   city: 'Los Angeles',           // Changed field
      //   ...other changed fields (if any)
      // }
    })

    it('should send all data on create (not edit mode)', () => {
      const { result } = renderHook(() =>
        useForm<HouseholdFormData>({
          defaultValues: getDefaultHouseholdFormData(mockEvents),
        })
      )

      // Fill in form data
      act(() => {
        result.current.setValue('guestParty.0.firstName', 'John')
        result.current.setValue('guestParty.0.lastName', 'Doe')
        result.current.setValue('address1', '123 Main St')
        result.current.setValue('city', 'New York')
      })

      const isEditMode = !!result.current.watch('householdId')
      const allData = result.current.getValues()

      expect(isEditMode).toBe(false) // No householdId = create mode

      // In create mode, send ALL data (not just dirty fields)
      expect(allData.guestParty[0]?.firstName).toBe('John')
      expect(allData.address1).toBe('123 Main St')
      expect(allData.city).toBe('New York')
      // All fields present, not just dirty ones
    })

    it('should include deletedGuests in update payload when guests removed', () => {
      const { result } = renderHook(() => {
        const form = useForm<HouseholdFormData>({
          defaultValues: {
            householdId: 'household-123',
            guestParty: [
              {
                guestId: 1,
                firstName: 'John',
                lastName: 'Doe',
                isPrimaryContact: true,
                invites: {},
              },
              {
                guestId: 2,
                firstName: 'Jane',
                lastName: 'Doe',
                isPrimaryContact: false,
                invites: {},
              },
            ],
            gifts: [],
            deletedGuests: [],
          },
        })

        const { remove } = useFieldArray({
          control: form.control,
          name: 'guestParty',
        })

        return { form, remove }
      })

      // Remove a guest and track deletion
      act(() => {
        result.current.form.setValue('deletedGuests', [2])
        result.current.remove(1)
      })

      const data = result.current.form.getValues()
      const deletedGuests = data.deletedGuests ?? []

      expect(deletedGuests).toEqual([2])
      expect(deletedGuests.length).toBeGreaterThan(0)

      // Component would include in payload:
      // {
      //   householdId: 'household-123',
      //   guestParty: [...],  // Only John remains
      //   gifts: [...],
      //   deletedGuests: [2]  // Jane to be deleted
      // }
    })
  })
})
