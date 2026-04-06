import {
  formatWorkspaceScopeDriftReport,
  formatWorkspaceScopeDriftSqlChecklist,
  parseArgs,
  runWorkspaceScopeDriftCommand,
  validateArgs,
} from '~/server/scripts/report-workspace-scope-drift'

describe('report-workspace-scope-drift helpers', () => {
  it('parses json output flag', () => {
    expect(parseArgs(['--json'])).toEqual({
      customerEmail: null,
      json: true,
      sql: false,
    })
    expect(parseArgs(['--sql'])).toEqual({
      customerEmail: null,
      json: false,
      sql: true,
    })
    expect(parseArgs(['--sql', '--customer-email=queen.lillian@swamp.wed'])).toEqual({
      customerEmail: 'queen.lillian@swamp.wed',
      json: false,
      sql: true,
    })
    expect(parseArgs(['--customer-email='])).toEqual({
      customerEmail: null,
      json: false,
      sql: false,
    })
    expect(parseArgs(['--customer-email=  queen.lillian@swamp.wed  '])).toEqual({
      customerEmail: 'queen.lillian@swamp.wed',
      json: false,
      sql: false,
    })
    expect(parseArgs(['--json', '--sql'])).toEqual({
      customerEmail: null,
      json: true,
      sql: true,
    })
    expect(parseArgs(['--customer-email'])).toEqual({
      customerEmail: null,
      json: false,
      sql: false,
    })
    expect(parseArgs([])).toEqual({
      customerEmail: null,
      json: false,
      sql: false,
    })
  })

  it('validates incompatible flag combinations', () => {
    expect(() =>
      validateArgs({
        customerEmail: null,
        json: true,
        sql: true,
      })
    ).toThrow('Cannot combine --json and --sql.')

    expect(() =>
      validateArgs({
        customerEmail: 'queen.lillian@swamp.wed',
        json: false,
        sql: false,
      })
    ).toThrow('--customer-email can only be used together with --sql.')
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

    expect(output).toBe(
      [
        'Workspace Scope Drift Report',
        '- weddingsWithoutOrganization: 1',
        '- organizationsWithoutWedding: 2',
        '- sessionsMissingOrganization: 4',
        '- sessionsMissingMembership: 3',
        '- sessionsWithOrganizationWithoutWedding: 5',
        '- usersWithMultipleOrganizationMemberships: 6',
      ].join('\n')
    )
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

  it('formats SQL checklist output for single-customer migration prep', () => {
    const output = formatWorkspaceScopeDriftSqlChecklist({
      customerEmail: 'queen.lillian@swamp.wed',
    })

    expect(output).toContain('Workspace Scope Drift SQL Checklist')
    expect(output).toContain(`where u.email = 'queen.lillian@swamp.wed'`)
    expect(output).toContain(`and u.email = 'queen.lillian@swamp.wed'`)
    expect(output).toContain('BEGIN;')
    expect(output).toContain('COMMIT;')
    expect(output).toContain('from "Session" s')
    expect(output).toContain('join "User" u on u.id = s."userId"')
    expect(output).toContain('left join "Wedding" w on w."organizationId" = m."organizationId"')
    expect(output).toContain(
      'left join "UserWedding" uw on uw."userId" = u.id and uw."weddingId" = w.id'
    )
    expect(output.indexOf('-- 1) Audit role and workspace linkage')).toBeLessThan(
      output.indexOf('-- 2) Find sessions pinned to invalid organizations')
    )
    expect(output.indexOf('-- 2) Find sessions pinned to invalid organizations')).toBeLessThan(
      output.indexOf('-- 3) Transaction template for single-customer fix (review first, then run)')
    )
  })

  it('formats SQL checklist output without customer filter when no email is provided', () => {
    const output = formatWorkspaceScopeDriftSqlChecklist({
      customerEmail: null,
    })

    expect(output).toContain('-- Optional: add `where u.email = <customer-email>`')
    expect(output).toContain('-- Optional: add `and u.email = <customer-email>`')
    expect(output).not.toContain(`where u.email = '`)
  })

  it('escapes customer email safely in generated SQL', () => {
    const output = formatWorkspaceScopeDriftSqlChecklist({
      customerEmail: "o'brien@example.com",
    })

    expect(output).toContain(`where u.email = 'o''brien@example.com'`)
    expect(output).toContain(`and u.email = 'o''brien@example.com'`)
    expect(output).not.toContain(`where u.email = 'o'brien@example.com'`)
  })

  it('prints SQL output without loading the database client', async () => {
    const writeStdout = jest.fn()
    const loadDb = jest.fn()

    await runWorkspaceScopeDriftCommand(['--sql', '--customer-email=queen.lillian@swamp.wed'], {
      loadDb,
      writeStdout,
    })

    expect(loadDb).not.toHaveBeenCalled()
    expect(writeStdout).toHaveBeenCalledWith(
      expect.stringContaining(`where u.email = 'queen.lillian@swamp.wed'`)
    )
  })
})
