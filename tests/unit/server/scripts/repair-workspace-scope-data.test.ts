import { parseArgs as parseClearArgs } from '~/server/scripts/clear-invalid-active-organizations'
import {
  decideSessionRepair,
  parseArgs as parseRepairArgs,
} from '~/server/scripts/repair-workspace-scope-data'

describe('repair-workspace-scope-data helpers', () => {
  it('parses write mode with dry-run default', () => {
    expect(parseRepairArgs([])).toEqual({ dryRun: true })
    expect(parseRepairArgs(['--write'])).toEqual({ dryRun: false })
    expect(parseClearArgs([])).toEqual({ dryRun: true })
    expect(parseClearArgs(['--write'])).toEqual({ dryRun: false })
  })

  it('keeps a valid current active organization', () => {
    expect(
      decideSessionRepair({
        currentActiveOrganizationId: 'org-1',
        primaryWeddingOrganizationId: 'org-2',
        validOrganizationIds: ['org-1', 'org-2'],
      })
    ).toEqual({
      action: 'keep',
      nextActiveOrganizationId: 'org-1',
    })
  })

  it('repairs to the primary wedding organization when current scope is invalid', () => {
    expect(
      decideSessionRepair({
        currentActiveOrganizationId: 'org-stale',
        primaryWeddingOrganizationId: 'org-primary',
        validOrganizationIds: ['org-primary', 'org-other'],
      })
    ).toEqual({
      action: 'set',
      nextActiveOrganizationId: 'org-primary',
    })
  })

  it('repairs to the only valid organization when there is one safe choice', () => {
    expect(
      decideSessionRepair({
        currentActiveOrganizationId: null,
        primaryWeddingOrganizationId: null,
        validOrganizationIds: ['org-only'],
      })
    ).toEqual({
      action: 'set',
      nextActiveOrganizationId: 'org-only',
    })
  })

  it('clears an invalid active organization when multiple valid choices exist', () => {
    expect(
      decideSessionRepair({
        currentActiveOrganizationId: 'org-stale',
        primaryWeddingOrganizationId: null,
        validOrganizationIds: ['org-1', 'org-2'],
      })
    ).toEqual({
      action: 'clear',
      nextActiveOrganizationId: null,
    })
  })

  it('does nothing when there is no current scope and no deterministic replacement', () => {
    expect(
      decideSessionRepair({
        currentActiveOrganizationId: null,
        primaryWeddingOrganizationId: null,
        validOrganizationIds: ['org-1', 'org-2'],
      })
    ).toEqual({
      action: 'noop',
      nextActiveOrganizationId: null,
    })
  })
})
