import {
  formatWorkspaceScopeDriftReport,
  parseArgs,
} from '~/server/scripts/report-workspace-scope-drift'

describe('report-workspace-scope-drift helpers', () => {
  it('parses json output flag', () => {
    expect(parseArgs(['--json'])).toEqual({ json: true })
    expect(parseArgs([])).toEqual({ json: false })
  })

  it('formats a human-readable drift report', () => {
    const output = formatWorkspaceScopeDriftReport({
      organizationsWithoutWedding: 2,
      sessionsMissingMembership: 3,
      sessionsMissingOrganization: 4,
      sessionsWithOrganizationWithoutWedding: 5,
      usersWithMultipleOrganizationMemberships: 6,
      weddingsWithoutOrganization: 1,
    })

    expect(output).toContain('Workspace Scope Drift Report')
    expect(output).toContain('weddingsWithoutOrganization: 1')
    expect(output).toContain('usersWithMultipleOrganizationMemberships: 6')
  })

  it('formats json output when requested', () => {
    const output = formatWorkspaceScopeDriftReport(
      {
        organizationsWithoutWedding: 0,
        sessionsMissingMembership: 0,
        sessionsMissingOrganization: 0,
        sessionsWithOrganizationWithoutWedding: 0,
        usersWithMultipleOrganizationMemberships: 0,
        weddingsWithoutOrganization: 0,
      },
      true
    )

    expect(JSON.parse(output)).toEqual({
      organizationsWithoutWedding: 0,
      sessionsMissingMembership: 0,
      sessionsMissingOrganization: 0,
      sessionsWithOrganizationWithoutWedding: 0,
      usersWithMultipleOrganizationMemberships: 0,
      weddingsWithoutOrganization: 0,
    })
  })
})
