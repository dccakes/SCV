export const mockEnsureSeeded = jest.fn()

export const checklistSeedingService = {
  ensureSeeded: mockEnsureSeeded,
}

export const resetMocks = (): void => {
  mockEnsureSeeded.mockReset()
}
