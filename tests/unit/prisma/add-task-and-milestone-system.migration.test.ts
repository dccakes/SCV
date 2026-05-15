import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { getCanonicalMilestoneSeed } from '~/server/domains/milestone/milestone.seed'
import { getCanonicalTaskSeed } from '~/server/domains/task/task.seed'

const migrationPath = resolve(
  process.cwd(),
  'prisma/migrations/20260426120000_add_task_and_milestone_system/migration.sql'
)

describe('add_task_and_milestone_system migration', () => {
  it('keeps the SQL milestone backfill seed in sync with the canonical milestone seed', () => {
    const sql = readMigrationSql()
    const milestoneBlock = extractBlock(
      sql,
      'WITH milestone_seed("seedKey", "title", "category", "position") AS (',
      '),\neligible_weddings AS ('
    )

    const sqlMilestones = [...milestoneBlock.matchAll(milestoneTuplePattern)].map((match) => ({
      key: match[1] ?? '',
      title: match[2] ?? '',
      category: match[3] ?? '',
      position: Number(match[4]),
    }))

    expect(sqlMilestones).toEqual(
      getCanonicalMilestoneSeed().map((milestone) => ({
        key: milestone.key,
        title: milestone.title,
        category: milestone.category,
        position: milestone.position,
      }))
    )
  })

  it('keeps the SQL task backfill seed in sync with the canonical task seed', () => {
    const sql = readMigrationSql()
    const taskBlock = extractBlock(
      sql,
      'task_seed(\n    "seedKey",\n    "position",\n    "monthsBeforeWedding",\n    "category",\n    "title",\n    "milestoneKey"\n) AS (',
      '),\neligible_weddings AS ('
    )

    const sqlTasks = [...taskBlock.matchAll(taskTuplePattern)].map((match) => ({
      seedKey: match[1] ?? '',
      position: Number(match[2]),
      monthsBeforeWedding: Number(match[3]),
      category: match[4] ?? '',
      title: match[5] ?? '',
      milestoneKey: match[6] === 'NULL' ? null : (match[7] ?? null),
    }))

    expect(sqlTasks).toEqual(
      getCanonicalTaskSeed().map((task) => ({
        seedKey: task.seedKey,
        position: task.position,
        monthsBeforeWedding: task.monthsBeforeWedding,
        category: task.category,
        title: task.title,
        milestoneKey: task.milestoneKey ?? null,
      }))
    )
  })
})

const milestoneTuplePattern = /\('([^']+)', '([^']+)', '([^']+)'::"MilestoneCategory", (\d+)\)/g
const taskTuplePattern =
  /\('([^']+)', (\d+), (-?\d+), '([^']+)'::"TaskCategory", '([^']+)', (NULL|'([^']+)')\)/g

function readMigrationSql(): string {
  return readFileSync(migrationPath, 'utf-8')
}

function extractBlock(sql: string, startMarker: string, endMarker: string): string {
  const startIndex = sql.indexOf(startMarker)
  const endIndex = sql.indexOf(endMarker, startIndex)

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(`Could not find SQL block between "${startMarker}" and "${endMarker}"`)
  }

  return sql.slice(startIndex, endIndex)
}
