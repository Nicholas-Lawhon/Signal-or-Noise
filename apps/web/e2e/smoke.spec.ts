import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.route('**/api/**', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Test offline state' }) })); });

test('public navigation and legal routes', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Signal or Noise/ })).toBeVisible();
  await page.goto('/rules', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'How to play' })).toBeVisible();
  await page.goto('/disclaimer', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('article').getByText(/does not provide financial advice/i)).toBeVisible();
  await page.goto('/settings', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('switch', { name: /Reveal sounds/ })).toBeVisible();
});

test('mode selection', async ({ page }) => {
  await page.goto('/play'); await expect(page.getByRole('link', { name: /Classic Run/ })).toBeVisible();
});

test('classic setup', async ({ page }) => {
  await page.goto('/play/classic'); await expect(page.getByRole('heading', { name: 'Classic Run' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Easy/ })).toBeVisible();
});

test('daily gate, leaderboard and profile supporting states', async ({ page }) => {
  await page.goto('/play/daily', { waitUntil: 'domcontentloaded' }); await expect(page.getByRole('heading', { name: 'Daily Challenge' })).toBeVisible();
  await page.goto('/leaderboards', { waitUntil: 'domcontentloaded' }); await expect(page.getByRole('heading', { name: 'Leaderboards' })).toBeVisible();
  await page.goto('/profile', { waitUntil: 'domcontentloaded' }); await expect(page.getByRole('heading', { name: 'My Stats' })).toBeVisible();
});

test('keyboard focus is visible and preferences persist', async ({ page }) => {
  await page.goto('/settings'); const sound = page.getByRole('switch', { name: /Reveal sounds/ }); await sound.focus(); await expect(sound).toBeFocused(); await sound.press('Space'); const checked = await sound.getAttribute('aria-checked'); await page.reload(); await expect(page.getByRole('switch', { name: /Reveal sounds/ })).toHaveAttribute('aria-checked', checked ?? 'false');
});

test('landing reflows without horizontal overflow', async ({ page }) => {
  for (const width of [320, 375, 390, 768, 1024, 1440]) { await page.setViewportSize({ width, height: 900 }); await page.goto('/'); const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth); expect(overflow).toBe(false); }
});

test('reduced motion keeps the public journey available', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/'); await expect(page.getByRole('heading', { name: /Signal or Noise/ })).toBeVisible(); await page.goto('/settings'); await expect(page.getByText(/follows your device/)).toBeVisible();
});
