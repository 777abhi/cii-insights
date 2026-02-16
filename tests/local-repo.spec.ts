import { test, expect } from '@playwright/test';

test('browse local repo', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  // Click Browse button (folder icon)
  await page.getByTitle('Browse local folder').click();

  // Check if modal appears
  await expect(page.getByText('Browse Local Folder')).toBeVisible();

  // Navigate to /app to ensure consistent state
  const pathInput = page.locator('input[type="text"]').last();
  await pathInput.fill('/app');
  await pathInput.press('Enter');

  // Check if file list is populated.
  await expect(page.getByRole('button', { name: 'server' })).toBeVisible();

  // Click 'server' folder to navigate
  await page.getByRole('button', { name: 'server' }).click();

  // Wait for update - we should see 'src' inside server
  await expect(page.getByRole('button', { name: 'src' })).toBeVisible();

  // Select current folder (/app/server)
  await page.getByRole('button', { name: 'Select This Folder' }).click();

  // Modal should close
  await expect(page.getByText('Browse Local Folder')).toBeHidden();

  // Repo URL input should contain the path ending in 'server'
  const repoInput = page.getByPlaceholder('Git Repository URL');
  const value = await repoInput.inputValue();
  expect(value).toMatch(/server$/);
});
