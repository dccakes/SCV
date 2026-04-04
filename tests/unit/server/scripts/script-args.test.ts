import { parseDryRunArgs, parseOptionalEqualsArg } from '~/server/scripts/script-args'

describe('script-args', () => {
  it('parses optional equals-delimited string flags', () => {
    expect(
      parseOptionalEqualsArg(['--customer-email=queen.lillian@swamp.wed'], '--customer-email')
    ).toBe('queen.lillian@swamp.wed')
    expect(
      parseOptionalEqualsArg(['--customer-email=  queen.lillian@swamp.wed  '], '--customer-email')
    ).toBe('queen.lillian@swamp.wed')
    expect(parseOptionalEqualsArg(['--customer-email='], '--customer-email')).toBeNull()
    expect(parseOptionalEqualsArg(['--customer-email'], '--customer-email')).toBeNull()
  })

  it('defaults to dry-run mode', () => {
    expect(parseDryRunArgs([])).toEqual({ dryRun: true })
  })

  it('supports explicit dry-run flag', () => {
    expect(parseDryRunArgs(['--dry-run'])).toEqual({ dryRun: true })
  })

  it('switches to write mode when --write is provided', () => {
    expect(parseDryRunArgs(['--write'])).toEqual({ dryRun: false })
  })

  it('rejects conflicting dry-run and write flags', () => {
    expect(() => parseDryRunArgs(['--dry-run', '--write'])).toThrow(
      'Cannot combine --write and --dry-run.'
    )
  })
})
