describe('Jest Setup', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should support async/await', async () => {
    const result = await Promise.resolve('success')
    expect(result).toBe('success')
  })

  it('should have access to jest mocks', () => {
    const mockFn = jest.fn()
    mockFn('test')
    expect(mockFn).toHaveBeenCalledWith('test')
  })
})
