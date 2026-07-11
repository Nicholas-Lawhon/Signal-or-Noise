import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.route('**/api/**', (route) => { const url = new URL(route.request().url()); if (url.pathname === '/api/draft' && route.request().method() === 'GET') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ draft: null, context: { authenticated: false } }) }); if (url.pathname.startsWith('/api/battles/')) return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ code: 'UNAUTHENTICATED', message: 'Sign in to view this battle' }) }); return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Test offline state' }) }); }); });

test('public navigation and legal routes', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Signal or Noise/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeAttached();
  await page.getByRole('link', { name: 'Skip to content' }).focus();
  await page.getByRole('link', { name: 'Skip to content' }).press('Enter');
  await expect(page.locator('main#main-content')).toBeFocused();
  await page.goto('/rules', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'How to play' })).toBeVisible();
  await page.goto('/disclaimer', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('article').getByText(/does not provide financial advice/i)).toBeVisible();
  await page.goto('/settings', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('switch', { name: /Reveal sounds/ })).toBeVisible();
});

test('mode selection', async ({ page }) => {
  await page.goto('/play'); await expect(page.getByRole('link', { name: /Classic Run/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Portfolio Draft/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Friend Battle/ })).toBeVisible();
});

test('competitive routes expose guest Draft and Battle auth boundary', async ({ page }) => {
  await page.goto('/play/draft'); await expect(page.getByRole('heading', { name: 'Portfolio Draft' })).toBeVisible();
  await page.goto('/play/battle'); await expect(page.getByRole('heading', { name: 'Friend Battle' })).toBeVisible();
  try { await page.goto('/play/battle/not-a-room'); } catch { await page.waitForURL(/\/play\/battle(?:\/not-a-room)?$/); }
  if (new URL(page.url()).pathname === '/play/battle') await expect(page.getByRole('heading', { name: 'Friend Battle' })).toBeVisible();
  else await expect(page.getByText(/Sign in to view this battle|not yours to watch/)).toBeVisible();
});

test('Battle room rejects a signed-in non-participant', async ({ page }) => {
  await page.route('**/api/battles/forbidden-room', (route) => route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Not your battle' } }) }));
  await page.goto('/play/battle/forbidden-room'); await expect(page.getByText('This battle is not yours to watch.')).toBeVisible();
});

test('guest Draft completes and reloads its immutable reveal', async ({ page }) => {
  const cards = Array.from({ length: 6 }, (_, slot) => ({ slot, title: `Hidden company ${slot + 1}`, decisionDateLabel: '2020', holdingPeriodLabel: 'One year', companyDescription: 'A disguised company under pressure.', macroContext: 'A changing market.', situation: 'Demand is shifting.', longCase: 'Execution could win.', shortCase: 'Competition could bite.', setupHints: [], lookbackChart: [{ date: '2020-01-01', price: 10 }, { date: '2020-02-01', price: 11 }] }));
  const current = { id: 'draft-1', status: 'in_progress', isOfficial: false, budget: 10000, windowLabel: '2020–2021', cards };
  const completed = { id: 'draft-1', status: 'completed', isOfficial: false, budget: 10000, windowLabel: '2020–2021', finalValue: 12000, optimalValue: 13000, gapFromOptimal: 1000, companies: cards.map((card) => ({ slot: card.slot, title: card.title, companyName: `Company ${card.slot + 1}`, ticker: `C${card.slot + 1}`, actualReturnPercent: card.slot / 10, selected: card.slot < 3, optimal: card.slot >= 3, sliceValue: card.slot < 3 ? 4000 : null })) };
  await page.route('**/api/draft**', (route) => { const url = new URL(route.request().url()); const method = route.request().method(); const draft = method === 'POST' && url.pathname.endsWith('/selections') ? completed : method === 'POST' ? current : url.pathname === '/api/draft/draft-1' ? completed : null; return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ draft, context: { authenticated: false } }) }); });
  await page.goto('/play/draft'); await page.getByRole('button', { name: 'Start a Draft' }).click();
  const pickButtons = page.getByRole('button', { name: 'Draft this company' }); await expect(pickButtons).toHaveCount(6); for (let index = 0; index < 3; index += 1) await pickButtons.nth(index).click();
  await page.getByRole('button', { name: 'Lock in picks (3/3)' }).click(); await expect(page.getByText('Draft complete')).toBeVisible(); await expect(page).toHaveURL(/draftId=draft-1/);
  await page.reload(); await expect(page.getByText('Draft complete')).toBeVisible();
});

test('classic setup', async ({ page }) => {
  await page.goto('/play/classic'); await expect(page.getByRole('heading', { name: 'Classic Run' })).toBeVisible();
  await expect(page.getByText(/Guest results are unofficial and stay on this device/)).toBeVisible();
  await expect(page.getByRole('link', { name: /Easy/ })).toBeVisible();
});

test('daily gate, leaderboard and profile supporting states', async ({ page }) => {
  await page.goto('/play/daily', { waitUntil: 'domcontentloaded' }); await expect(page.getByRole('heading', { name: 'Daily Challenge' })).toBeVisible();
  await page.goto('/leaderboards', { waitUntil: 'domcontentloaded' }); await expect(page.getByRole('heading', { name: 'Leaderboards' })).toBeVisible();
  await page.goto('/profile', { waitUntil: 'domcontentloaded' }); await expect(page.getByRole('heading', { name: 'My Stats' })).toBeVisible();
});

test('empty leaderboards invite the next play', async ({ page }) => {
  await page.route('**/api/leaderboards*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ rows: [], currentUserRow: null, pagination: { page: 1, pageSize: 20, totalEntries: 0, totalPages: 1 }, viewer: { isAuthenticated: false } }) }));
  await page.goto('/leaderboards?board=signal');
  await expect(page.getByRole('heading', { name: 'No Signal scores yet' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Play Classic' })).toBeVisible();
});

test('keyboard focus is visible and preferences persist', async ({ page }) => {
  await page.goto('/settings'); const sound = page.getByRole('switch', { name: 'Reveal sounds' }); await sound.focus(); await expect(sound).toBeFocused(); await sound.press('Space'); const checked = await sound.getAttribute('aria-checked'); await page.reload(); await expect(page.getByRole('switch', { name: 'Reveal sounds' })).toHaveAttribute('aria-checked', checked ?? 'false');
});

test('landing reflows without horizontal overflow', async ({ page }) => {
  for (const width of [320, 375, 390, 768, 1024, 1440]) { await page.setViewportSize({ width, height: 900 }); await page.goto('/'); const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth); expect(overflow).toBe(false); }
});

test('reduced motion keeps the public journey available', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/'); await expect(page.getByRole('heading', { name: /Signal or Noise/ })).toBeVisible(); await page.goto('/settings'); await expect(page.getByText(/follows your device/)).toBeVisible();
});

test('guest Classic locks directly into a private, normalized reveal', async ({ page }) => {
  await page.unroute('**/api/**');
  const run = {
    id: 'run-1', mode: 'classic_run', difficulty: 'easy', status: 'in_progress', isOfficial: false,
    startingBankroll: 10000, currentBankroll: 10000, signalScore: 0, totalRounds: 10,
    completedRounds: 0, currentRoundIndex: 0, currentStreak: 0, bestStreak: 0,
    round: {
      roundIndex: 0, difficulty: 'easy', title: 'A Balanced Setup', decisionDateLabel: '2020',
      holdingPeriodLabel: 'One year', companyDescription: 'A company\u00e2\u20ac\u2122s growth story meets a real test.',
      macroContext: 'A shifting market.', situation: 'Demand and execution pull in different directions.',
      longCase: 'Execution could win.', shortCase: 'Competition could bite.', setupHints: [],
      lookbackChart: [{ date: '2019-01-01', price: 10 }, { date: '2020-01-01', price: 12 }],
    },
  };
  const result = {
    run: { id: 'run-1', status: 'in_progress', currentBankroll: 10350, signalScore: 1, completedRounds: 1, totalRounds: 10, currentStreak: 1, bestStreak: 1 },
    round: { roundIndex: 0, scenarioId: 'scenario-1', action: 'long', confidence: 'low', stakeAmount: 1000, pnlAmount: 350, bankrollBefore: 10000, bankrollAfter: 10350, signalScoreDelta: 1, wasCorrect: true, companyGuess: null, companyGuessCorrect: null },
    reveal: { scenarioId: 'scenario-1', companyName: 'Hidden Company', ticker: 'HID', outcomeLabel: '2020 to 2021', endingPrice: 13.5, actualReturnPercent: 0.35, shortText: 'That was Hidden Company. The company\u00e2\u20ac\u2122s execution paid off.', funFact: 'Its product reached more customers.', whyItMoved: ['Growth accelerated.', 'Margins held.', 'Investors noticed.'], outcomeChart: [{ date: '2020-01-01', price: 12 }, { date: '2021-01-01', price: 13.5 }] },
  };
  await page.route('**/api/runs/classic', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ run, context: { isAuthenticated: false, hasGuestSession: true } }) }));
  await page.route('**/api/runs/run-1/decisions', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(result) }));
  await page.goto('/play/classic/run?difficulty=easy');
  await expect(page.getByText('A company’s growth story meets a real test.')).toBeVisible();
  await page.getByRole('button', { name: 'Long' }).click();
  await page.getByRole('button', { name: /Low \(10%\)/ }).click();
  await page.getByRole('button', { name: 'Lock In' }).click();
  await expect(page.getByRole('heading', { name: 'That was Hidden Company.' })).toBeVisible();
  await expect(page.getByText('The company’s execution paid off.')).toBeVisible();
  await expect(page.getByText('Call locked.')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Reveal Result' })).toHaveCount(0);
});
