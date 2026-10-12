import { expect, test } from '@playwright/test'

test.describe('RSVP Question Other Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/events')
  })

  test('creates a multiple-choice question with manual Other toggle control', async ({ page }) => {
    const uniqueQuestion = `Meal preference ${Date.now()}`

    await page.getByRole('button', { name: /manage rsvp questions for swamp ceremony/i }).click()

    const manageDialog = page.getByRole('dialog').filter({
      has: page.getByRole('heading', { name: /rsvp questions/i }),
    })
    await expect(manageDialog).toBeVisible()

    await manageDialog.getByRole('button', { name: /add question/i }).click()

    const formDialog = page.getByRole('dialog').filter({
      has: page.getByRole('heading', { name: /add rsvp question/i }),
    })

    await formDialog.getByLabel('Question').fill(uniqueQuestion)
    await formDialog.locator('#event-question-type').selectOption('Option')

    const allowOtherToggle = formDialog.getByLabel(/allow other write-in answer/i)
    await expect(allowOtherToggle).not.toBeChecked()

    await formDialog.getByPlaceholder('Option label').nth(0).fill('Chicken')
    await formDialog.getByPlaceholder('Option label').nth(1).fill('Fish')

    await allowOtherToggle.check()
    await formDialog.getByRole('button', { name: /add question/i }).click()

    const questionRow = manageDialog.locator('li').filter({ hasText: uniqueQuestion }).first()
    await expect(questionRow).toBeVisible()
    await expect(questionRow.getByText(/other enabled/i)).toBeVisible()

    await questionRow
      .getByRole('button', { name: new RegExp(`edit question ${uniqueQuestion}`, 'i') })
      .click()

    const editDialog = page.getByRole('dialog').filter({
      has: page.getByRole('heading', { name: /edit rsvp question/i }),
    })

    const editAllowOtherToggle = editDialog.getByLabel(/allow other write-in answer/i)
    await expect(editAllowOtherToggle).toBeChecked()
    await editAllowOtherToggle.uncheck()
    await editDialog.getByRole('button', { name: /save changes/i }).click()

    await expect(questionRow.getByText(/other enabled/i)).toHaveCount(0)
  })
})
