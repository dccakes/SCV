export const shouldShowUnsavedCloseConfirm = (isDirty: boolean, isLoading: boolean) =>
  isDirty && !isLoading
