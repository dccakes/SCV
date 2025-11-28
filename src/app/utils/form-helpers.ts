/**
 * Form Helper Utilities
 *
 * Common utilities for working with react-hook-form
 */

/**
 * Extracts only the fields that have been modified (dirty) from form data
 *
 * Useful for PATCH/UPDATE operations where you only want to send changed fields
 * to the server instead of the entire form payload.
 *
 * @example
 * ```typescript
 * const onSubmit = (data) => {
 *   if (formState.isDirty) {
 *     const changedData = getDirtyValues(formState.dirtyFields, data)
 *     updateMutation.mutate({ id, ...changedData })
 *   }
 * }
 * ```
 *
 * @param dirtyFields - The dirtyFields object from react-hook-form's formState
 * @param allValues - All form values from the submit handler
 * @returns An object containing only the dirty (changed) fields
 */
export function getDirtyValues<T extends Record<string, unknown>>(
  dirtyFields: Record<string, unknown>,
  allValues: T
): Partial<T> {
  const dirtyValues: Partial<T> = {}

  Object.keys(dirtyFields).forEach((key) => {
    const typedKey = key as keyof T
    const dirtyValue = dirtyFields[key]

    if (dirtyValue === true) {
      // Field is directly marked as dirty
      dirtyValues[typedKey] = allValues[typedKey]
    } else if (typeof dirtyValue === 'object' && dirtyValue !== null) {
      // Field is an object or array (nested fields)
      // For simplicity, include the entire nested structure if any part is dirty
      dirtyValues[typedKey] = allValues[typedKey]

      // Alternative: Deep traverse for more granular control
      // This would require recursive handling of nested objects
    }
  })

  return dirtyValues
}

/**
 * Type guard to check if a form field error is a field-level error
 * (as opposed to a root-level validation error)
 */
export function isFieldError(
  error: unknown
): error is { message?: string; type?: string; types?: Record<string, string> } {
  return typeof error === 'object' && error !== null && 'message' in error
}

/**
 * Formats an array of field errors into a single readable message
 */
export function formatFieldErrors(errors: Array<{ message?: string }>): string {
  return errors
    .filter((error) => error.message)
    .map((error) => error.message)
    .join(', ')
}
