import { test, expect } from '@playwright/test'

test.describe('Habit Tracker MVP User Flow (Definition of Done)', () => {
  test('creates 3 habits, checks them off today, views streak, and verifies persistence across reload', async ({
    page
  }) => {
    // 1. Visit the app
    await page.goto('/')
    await expect(page).toHaveURL(/.*today/)

    // Verify initial empty state
    await expect(page.getByText('Start Your First Habit')).toBeVisible()

    // Helper function to create a habit
    async function createHabit(name: string, emoji: string) {
      // Click Add Habit (either empty state or header button)
      const addButtons = page.getByRole('button', { name: /Add Habit|Add First Habit/i })
      await addButtons.first().click()

      // Fill in modal
      await page.fill('#habit-name', name)
      // Pick emoji
      await page.getByRole('button', { name: emoji, exact: true }).click()
      // Submit
      await page.getByRole('button', { name: /Create Habit/i }).click()
    }

    // 2. Create 3 distinct habits
    await createHabit('Drink 2L Water', '💧')
    await createHabit('Read 20 mins', '📚')
    await createHabit('Morning Run', '🏃')

    // Verify all 3 habits appear on the Today view
    await expect(page.getByText('Drink 2L Water')).toBeVisible()
    await expect(page.getByText('Read 20 mins')).toBeVisible()
    await expect(page.getByText('Morning Run')).toBeVisible()

    // Initially 0 of 3 completed
    await expect(page.getByText('0 of 3 habits completed')).toBeVisible()

    // 3. Check off all 3 habits for today
    const checkButtons = page.locator('button[aria-label*="complete"]')
    expect(await checkButtons.count()).toBe(3)

    // Check Habit 1
    await checkButtons.nth(0).click()
    await expect(page.getByText('1 of 3 habits completed')).toBeVisible()

    // Check Habit 2
    await checkButtons.nth(1).click()
    await expect(page.getByText('2 of 3 habits completed')).toBeVisible()

    // Check Habit 3
    await checkButtons.nth(2).click()
    await expect(page.getByText('3 of 3 habits completed')).toBeVisible()
    await expect(page.getByText('100%', { exact: true })).toBeVisible()

    // Verify celebratory message is shown
    await expect(page.getByText('All habits completed today!')).toBeVisible()

    // 4. Verify streaks show "1 day" for each
    const streakBadges = page.locator('div:has-text("1 day")')
    await expect(streakBadges.first()).toBeVisible()

    // 5. Reload the page and verify persistence from localStorage
    await page.reload()

    // All 3 habits must survive reload
    await expect(page.getByText('Drink 2L Water')).toBeVisible()
    await expect(page.getByText('Read 20 mins')).toBeVisible()
    await expect(page.getByText('Morning Run')).toBeVisible()

    // Status remains 3 of 3 completed
    await expect(page.getByText('3 of 3 habits completed')).toBeVisible()
    await expect(page.getByText('All habits completed today!')).toBeVisible()

    // 6. Navigate to Weekly view and verify matrix
    await page.click('a[href="/weekly"]')
    await expect(page).toHaveURL(/.*weekly/)
    await expect(page.getByText('7-Day Consistency Rate')).toBeVisible()
    await expect(page.getByText('Drink 2L Water')).toBeVisible()
    await expect(page.getByText('Read 20 mins')).toBeVisible()
    await expect(page.getByText('Morning Run')).toBeVisible()
  })
})
