import { extractAnalyticsContext } from '~/server/infrastructure/analytics/analytics-context'

describe('extractAnalyticsContext', () => {
  it('uses the authenticated user id as distinctId and pulls the active wedding id', () => {
    const result = extractAnalyticsContext({
      ctx: { auth: { userId: 'user_123', activeWeddingId: 'wed_abc' } },
      input: { name: 'Smith Household' },
      result: undefined,
    })

    expect(result.distinctId).toBe('user_123')
    expect(result.weddingId).toBe('wed_abc')
    expect(result.isAuthenticated).toBe(true)
  })

  it('falls back to a token as distinctId for anonymous public flows', () => {
    const result = extractAnalyticsContext({
      ctx: { auth: { userId: null, activeWeddingId: null } },
      input: { inviteToken: 'invite_tok_xyz', subUrl: 'jack-and-jill' },
      result: undefined,
    })

    expect(result.distinctId).toBe('invite_tok_xyz')
    expect(result.token).toBe('invite_tok_xyz')
    expect(result.subUrl).toBe('jack-and-jill')
    expect(result.isAuthenticated).toBe(false)
  })

  it('recovers the wedding id and household id from the mutation result when absent from input', () => {
    const result = extractAnalyticsContext({
      ctx: { auth: { userId: null, activeWeddingId: null } },
      input: { token: 'self_fill_tok' },
      result: { weddingId: 'wed_from_result', household: { id: 'hh_99' } },
    })

    expect(result.weddingId).toBe('wed_from_result')
    expect(result.householdId).toBe('hh_99')
    expect(result.token).toBe('self_fill_tok')
  })

  it('prefers accessToken and reads householdId directly from input', () => {
    const result = extractAnalyticsContext({
      ctx: { auth: { userId: null, activeWeddingId: null } },
      input: { accessToken: 'access_tok', householdId: 'hh_input' },
      result: null,
    })

    expect(result.token).toBe('access_tok')
    expect(result.householdId).toBe('hh_input')
  })

  it('produces an anonymous distinctId when nothing identifying is available', () => {
    const result = extractAnalyticsContext({
      ctx: { auth: { userId: null, activeWeddingId: null } },
      input: {},
      result: undefined,
    })

    expect(result.distinctId).toBe('anonymous')
    expect(result.isAuthenticated).toBe(false)
  })

  it('tolerates non-object input and results without throwing', () => {
    expect(() =>
      extractAnalyticsContext({
        ctx: { auth: { userId: null, activeWeddingId: null } },
        input: 'some-string-id',
        result: 42,
      })
    ).not.toThrow()
  })
})
