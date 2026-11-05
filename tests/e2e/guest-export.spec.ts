import { readFile } from 'node:fs/promises'
import { expect, type Page, test } from '@playwright/test'

const UTF8_BOM = '﻿'

const exportFile = async (page: Page, item: string | RegExp) => {
  await page.getByRole('button', { name: /^Export/ }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('menuitem', { name: item }).click()
  const download = await downloadPromise
  const path = await download.path()
  const text = await readFile(path, 'utf8')
  return { fileName: download.suggestedFilename(), text }
}

test.describe('Guest list export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/guest-list')
    await expect(page.getByRole('button', { name: /^Export/ })).toBeEnabled()
  })

  test('downloads every guest with RSVPs, contacts and a byte order mark', async ({ page }) => {
    const { fileName, text } = await exportFile(page, /All guests/)

    expect(fileName).toMatch(/^guest-list-\d{4}-\d{2}-\d{2}\.csv$/)
    expect(text.startsWith(UTF8_BOM)).toBe(true)
    const [header, ...rows] = text.slice(1).split('\r\n')
    expect(header).toContain('RSVP: Swamp Ceremony')
    expect(header).toContain('Email')
    expect(text).toContain('Donkey')
    // Stored phone numbers come out exactly as saved
    expect(text).toContain(',+12025550101,')
    expect(rows.length).toBeGreaterThan(0)
  })

  test('downloads one event for vendors without contact details', async ({ page }) => {
    const { fileName, text } = await exportFile(page, 'Welcome Feast')

    expect(fileName).toMatch(/^guests-welcome-feast-\d{4}-\d{2}-\d{2}\.csv$/)
    const header = text.slice(1).split('\r\n')[0]
    expect(header).toContain('RSVP')
    expect(header).toContain('Plus-one')
    expect(header).not.toContain('Email')
    expect(text).not.toContain('@swamp.wed')
  })

  test('confirms the download', async ({ page }) => {
    await exportFile(page, /All guests/)

    await expect(page.getByText(/^Downloaded guest-list-/)).toBeVisible()
  })
})
