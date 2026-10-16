import { buildSeatingCsv } from '~/lib/seating/seating-csv'

describe('buildSeatingCsv', () => {
  it('writes a header and one row per guest, seated guests first by table name', () => {
    const csv = buildSeatingCsv(
      [
        { id: 't2', name: 'Table 2' },
        { id: 't1', name: 'Head Table' },
      ],
      [
        { firstName: 'Zoe', lastName: 'Adams', tableId: null },
        { firstName: 'Ann', lastName: 'Lee', tableId: 't2' },
        { firstName: 'Bob', lastName: 'Ray', tableId: 't1' },
      ]
    )

    expect(csv.split('\r\n')).toEqual([
      'Guest Name,Table',
      'Bob Ray,Head Table',
      'Ann Lee,Table 2',
      'Zoe Adams,Unassigned',
    ])
  })

  it('quotes values containing commas, quotes or newlines', () => {
    const csv = buildSeatingCsv(
      [{ id: 't1', name: 'Family, "Close"' }],
      [{ firstName: 'Mary', lastName: 'O,Neil', tableId: 't1' }]
    )

    expect(csv.split('\r\n')[1]).toBe('"Mary O,Neil","Family, ""Close"""')
  })

  it('neutralizes spreadsheet formula injection', () => {
    const csv = buildSeatingCsv(
      [{ id: 't1', name: '=HYPERLINK("x")' }],
      [{ firstName: '+Evil', lastName: 'Guest', tableId: 't1' }]
    )

    expect(csv.split('\r\n')[1]).toBe(`'+Evil Guest,"'=HYPERLINK(""x"")"`)
  })
})
