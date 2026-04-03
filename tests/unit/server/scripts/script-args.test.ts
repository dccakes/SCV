import { parseDryRunArgs } from '~/server/scripts/script-args'

describe('script-args', () => {
  it('defaults to dry-run mode', () => {
    expect(parseDryRunArgs([])).toEqual({ dryRun: true })
  })

  it('supports explicit dry-run flag', () => {
    expect(parseDryRunArgs(['--dry-run'])).toEqual({ dryRun: true })
  })

  it('switches to write mode when --write is provided', () => {
    expect(parseDryRunArgs(['--write'])).toEqual({ dryRun: false })
  })

  it('prioritizes write mode when both flags are provided', () => {
    expect(parseDryRunArgs(['--dry-run', '--write'])).toEqual({ dryRun: false })
  })
})
