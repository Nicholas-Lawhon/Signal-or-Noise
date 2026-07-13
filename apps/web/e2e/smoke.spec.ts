import { expect, test, type Page } from '@playwright/test';

type DraftFormat = 'classic' | 'quick' | 'era';

const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });
const draftCards = (count: number) => Array.from({ length: count }, (_, slot) => ({
  slot, title: `Hidden company ${slot + 1}`, decisionDateLabel: '2020', holdingPeriodLabel: 'One year',
  companyDescription: 'A disguised company under pressure.', macroContext: 'A changing market.',
  situation: 'Demand is shifting.', longCase: 'Execution could win.', shortCase: 'Competition could bite.', setupHints: [],
  lookbackChart: [{ date: '2020-01-01', price: 10 }, { date: '2020-02-01', price: 11 }],
}));
const noOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/draft/eras') return route.fulfill(json({ eras: [] }));
    if (url.pathname === '/api/draft' && route.request().method() === 'GET') return route.fulfill(json({ draft: null, context: { isAuthenticated: false } }));
    if (url.pathname.startsWith('/api/battles/')) return route.fulfill(json({ error: { code: 'UNAUTHENTICATED', message: 'Sign in to view this battle' } }, 401));
    return route.fulfill(json({ error: { code: 'OFFLINE', message: 'Test offline state' } }, 503));
  });
});

test('public navigation, Smart Pass rules, and legal routes', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Signal or Noise/ })).toBeVisible();
  await page.getByRole('link', { name: 'Skip to content' }).focus();
  await page.getByRole('link', { name: 'Skip to content' }).press('Enter');
  await expect(page.locator('main#main-content')).toBeFocused();
  await page.goto('/rules', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'How to play' })).toBeVisible();
  await expect(page.getByText(/earns \+1 Smart Pass Signal/)).toBeVisible();
  await expect(page.getByText(/Classic is 6 choose 3, Quick is 4 choose 2, and Era is 6 choose 3/)).toBeVisible();
  await page.goto('/disclaimer', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('article').getByText(/does not provide financial advice/i)).toBeVisible();
  await page.goto('/settings', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('switch', { name: /Reveal sounds/ })).toBeVisible();
});

test('mode selection exposes both competitive modes', async ({ page }) => {
  await page.goto('/play');
  await expect(page.getByRole('link', { name: /Classic Run/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Portfolio Draft/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Friend Battle/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Draft Battle/ })).toBeVisible();
});

test('guest Draft stays public while Friend Battle keeps its auth boundary', async ({ page }) => {
  await page.goto('/play/draft', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Portfolio Draft' })).toBeVisible();
  await page.goto('/play/battle', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Friend Battle' })).toBeVisible();
  try { await page.goto('/play/battle/not-a-room'); } catch { await page.waitForURL(/\/play\/battle(?:\/not-a-room)?$/); }
  if (new URL(page.url()).pathname === '/play/battle') await expect(page.getByRole('heading', { name: 'Friend Battle' })).toBeVisible();
  else await expect(page.getByText(/Sign in to view this battle|not yours to watch/)).toBeVisible();
});

test('Friend Battle room rejects a non-participant', async ({ page }) => {
  await page.route('**/api/battles/forbidden-room', (route) => route.fulfill(json({ error: { code: 'FORBIDDEN', message: 'Not your battle' } }, 403)));
  await page.goto('/play/battle/forbidden-room');
  await expect(page.getByText('This battle is not yours to watch.')).toBeVisible();
});

test('all weighted Draft formats submit valid allocations and reload immutable reveals', async ({ page }) => {
  const eras = [{ id: 'era-2020', name: 'The 2020 reset', description: 'Compatible 2020 cards' }];
  for (const format of ['classic', 'quick', 'era'] as DraftFormat[]) {
    const count = format === 'quick' ? 4 : 6;
    const picks = format === 'quick' ? 2 : 3;
    const id = `draft-${format}`;
    const cards = draftCards(count);
    const current = { id, status: 'in_progress', isOfficial: false, format, eraId: format === 'era' ? 'era-2020' : null, budget: 10000, windowLabel: '2020–2021', cards };
    const weights = picks === 2 ? [60, 40] : [60, 20, 20];
    const completed = { ...current, status: 'completed', finalValue: 12000, optimalValue: 13000, gapFromOptimal: 1000, cards: undefined, companies: cards.map((card, index) => ({ slot: card.slot, title: card.title, companyName: `Company ${index + 1}`, ticker: `C${index + 1}`, actualReturnPercent: index / 10, selected: index < picks, optimal: index === 0 || index >= count - picks + 1, allocationPercent: index < picks ? weights[index] : null, allocatedValue: index < picks ? 4000 : null, optimalAllocationPercent: index === 0 || index >= count - picks + 1 ? 40 : undefined })) };
    let submission: unknown;
    await page.route('**/api/draft**', (route) => {
      const url = new URL(route.request().url());
      const method = route.request().method();
      if (url.pathname === '/api/draft/eras') return route.fulfill(json({ eras }));
      if (url.pathname.endsWith('/selections')) { submission = route.request().postDataJSON(); return route.fulfill(json({ draft: completed, context: { isAuthenticated: false } })); }
      if (url.pathname === `/api/draft/${id}`) return route.fulfill(json({ draft: completed, context: { isAuthenticated: false } }));
      if (url.pathname === '/api/draft' && method === 'POST') return route.fulfill(json({ draft: current, context: { isAuthenticated: false } }));
      return route.fulfill(json({ draft: null, context: { isAuthenticated: false } }));
    });
    await page.goto('/play/draft');
    await page.getByRole('button', { name: `${format === 'classic' ? 'Classic' : format === 'quick' ? 'Quick' : 'Era'} Draft`, exact: false }).click();
    if (format === 'era') await page.getByLabel('Era').selectOption('era-2020');
    await page.getByRole('button', { name: 'Start a Draft' }).click();
    const pickButtons = page.getByRole('button', { name: 'Draft this company' });
    await expect(pickButtons).toHaveCount(count);
    for (let index = 0; index < picks; index += 1) await pickButtons.first().click();
    await page.getByLabel('Allocation for Hidden company 1').selectOption('60');
    await expect(page.getByText('Allocated: 100%', { exact: false })).toBeVisible();
    expect(await noOverflow(page)).toBe(true);
    await page.getByRole('button', { name: 'Lock in portfolio' }).click();
    await expect(page.getByText(/Draft complete/)).toBeVisible();
    await expect(page.getByText('Optimal · 40%', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Your pick', { exact: true }).first()).toBeVisible();
    expect(submission).toEqual({ slots: Array.from({ length: picks }, (_, index) => index), allocations: weights });
    await expect(page).toHaveURL(new RegExp(`draftId=${id}`));
    await page.reload();
    await expect(page.getByText(/Draft complete/)).toBeVisible();
    await page.unroute('**/api/draft**');
  }
});

test('Draft leaderboards remain separated by format', async ({ page }) => {
  const seen: string[] = [];
  await page.route('**/api/leaderboards*', (route) => {
    const format = new URL(route.request().url()).searchParams.get('format') ?? 'classic';
    seen.push(format);
    return route.fulfill(json({ format, rows: [{ rank: 1, publicName: `${format} leader`, finalValue: format === 'classic' ? 14000 : format === 'quick' ? 13000 : 12000, gapFromOptimal: 500, completedAt: '2026-07-12T00:00:00.000Z', isCurrentUser: false }], currentUserRow: null, pagination: { page: 1, pageSize: 20, totalEntries: 1, totalPages: 1 }, viewer: { isAuthenticated: false } }));
  });
  await page.goto('/leaderboards?board=draft&format=classic');
  await expect(page.getByText('classic leader')).toBeVisible();
  await page.getByRole('button', { name: 'quick' }).click();
  await expect(page.getByText('quick leader')).toBeVisible();
  await page.getByRole('button', { name: 'era' }).click();
  await expect(page.getByText('era leader')).toBeVisible();
  expect(seen).toEqual(expect.arrayContaining(['classic', 'quick', 'era']));
  expect(await noOverflow(page)).toBe(true);
});

test('empty leaderboards invite the next play', async ({ page }) => {
  await page.route('**/api/leaderboards*', (route) => route.fulfill(json({ rows: [], currentUserRow: null, pagination: { page: 1, pageSize: 20, totalEntries: 0, totalPages: 1 }, viewer: { isAuthenticated: false } })));
  await page.goto('/leaderboards?board=signal');
  await expect(page.getByRole('heading', { name: 'No Signal scores yet' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Play Classic' })).toBeVisible();
});

test('Draft Battle create persists a reloadable invite URL', async ({ page }) => {
  const now = new Date().toISOString();
  const waiting = { id: 'db-1', status: 'awaiting_opponent', format: 'quick', eraId: null, timerSeconds: 120, budget: 10000, inviteCode: '0123456789abcdef0123456789abcdef', submissionDeadlineAt: null, expiresAt: new Date(Date.now() + 86400000).toISOString(), serverNow: now, cards: null, you: { name: 'You', hasSubmitted: false, selectedSlots: null, allocations: null }, opponent: null, outcome: null, reveal: null };
  let stateReads = 0;
  await page.route('**/api/draft-battles**', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/draft-battles' && route.request().method() === 'POST') return route.fulfill(json({ battle: waiting, context: { isAuthenticated: true } }));
    if (url.pathname === '/api/draft-battles/db-1') { stateReads += 1; return route.fulfill(json({ battle: waiting, context: { isAuthenticated: true } })); }
    return route.fulfill(json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, 404));
  });
  await page.goto('/play/draft-battle');
  await page.getByRole('button', { name: 'quick' }).click();
  await page.getByRole('button', { name: 'Create invite' }).click();
  await expect(page).toHaveURL(/battleId=db-1/);
  await expect(page.getByText(/invite=0123456789abcdef/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Waiting for your opponent' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Hidden company/ })).toHaveCount(0);
  expect(stateReads).toBeGreaterThan(0);
  expect(await noOverflow(page)).toBe(true);
});

test('Draft Battle invite, timed weighted submission, privacy, and reveal work on mobile', async ({ page }) => {
  const cards = draftCards(4);
  const now = new Date();
  const active = { id: 'db-2', status: 'awaiting_submissions', format: 'quick', eraId: null, timerSeconds: 120, budget: 10000, submissionDeadlineAt: new Date(now.getTime() + 120000).toISOString(), expiresAt: new Date(now.getTime() + 86400000).toISOString(), serverNow: now.toISOString(), cards, you: { name: 'You', hasSubmitted: false, selectedSlots: null, allocations: null }, opponent: { name: 'Rival', hasSubmitted: false }, outcome: null, reveal: null };
  const settled = { ...active, status: 'completed', cards: null, submissionDeadlineAt: active.submissionDeadlineAt, you: { ...active.you, hasSubmitted: true, selectedSlots: [0, 1], allocations: [60, 40] }, opponent: { name: 'Rival', hasSubmitted: true }, outcome: 'you_won', reveal: { companies: cards.map((card, index) => ({ slot: index, title: card.title, companyName: `Revealed ${index + 1}`, ticker: `R${index + 1}`, actualReturnPercent: index / 10, youSelected: index < 2, opponentSelected: index === 1 || index === 3, youAllocationPercent: index === 0 ? 60 : index === 1 ? 40 : null, opponentAllocationPercent: index === 1 ? 50 : index === 3 ? 50 : null })), you: { finalValue: 13000, gapFromOptimal: 200, forfeited: false }, opponent: { finalValue: 12000, gapFromOptimal: 1200, forfeited: false } } };
  let submission: unknown;
  await page.route('**/api/draft-battles**', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/invite/') && route.request().method() === 'GET') return route.fulfill(json({ invite: { format: 'quick', eraId: null, timerSeconds: 120, status: 'awaiting_opponent', joinable: true }, context: { isAuthenticated: true } }));
    if (url.pathname.endsWith('/join')) return route.fulfill(json({ battle: active, context: { isAuthenticated: true } }));
    if (url.pathname.endsWith('/submissions')) { submission = route.request().postDataJSON(); return route.fulfill(json({ battle: settled, context: { isAuthenticated: true } })); }
    if (url.pathname === '/api/draft-battles/db-2') return route.fulfill(json({ battle: active, context: { isAuthenticated: true } }));
    return route.fulfill(json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, 404));
  });
  await page.goto('/play/draft-battle?invite=0123456789abcdef0123456789abcdef');
  await expect(page.getByText(/quick Draft/)).toBeVisible();
  await page.getByRole('button', { name: 'Join battle' }).click();
  await expect(page).toHaveURL(/battleId=db-2/);
  await expect(page.getByText(/Time left: 2:00|Time left: 1:59/)).toBeVisible();
  await expect(page.getByText('Revealed 1')).toHaveCount(0);
  const cardsToPick = page.getByRole('button', { name: /Hidden company/ });
  await cardsToPick.nth(0).click(); await cardsToPick.nth(1).click();
  await page.getByLabel('Allocation for card 1').selectOption('60');
  await expect(page.getByText('Allocated: 100%', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Submit private portfolio' }).click();
  expect(submission).toEqual({ slots: [0, 1], allocations: [60, 40] });
  await expect(page.getByRole('heading', { name: 'You won' })).toBeVisible();
  await expect(page.getByText('Revealed 1')).toBeVisible();
  await expect(page.getByText('You · 40%', { exact: true })).toBeVisible();
  await expect(page.getByText('Opponent · 50%', { exact: true }).first()).toBeVisible();
  expect(await noOverflow(page)).toBe(true);
});

test('Smart Pass eligibility stays hidden until a settled Classic reveal', async ({ page }) => {
  await page.unroute('**/api/**');
  const run = { id: 'run-1', mode: 'classic_run', difficulty: 'easy', status: 'in_progress', isOfficial: false, startingBankroll: 10000, currentBankroll: 10000, signalScore: 0, totalRounds: 10, completedRounds: 0, currentRoundIndex: 0, currentStreak: 0, bestStreak: 0, round: { roundIndex: 0, difficulty: 'easy', title: 'A Balanced Setup', decisionDateLabel: '2020', holdingPeriodLabel: 'One year', companyDescription: 'A disguised growth story meets a real test.', macroContext: 'A shifting market.', situation: 'Demand and execution pull in different directions.', longCase: 'Execution could win.', shortCase: 'Competition could bite.', setupHints: [], lookbackChart: [{ date: '2019-01-01', price: 10 }, { date: '2020-01-01', price: 12 }] } };
  const result = { run: { id: 'run-1', status: 'in_progress', currentBankroll: 10000, signalScore: 1, completedRounds: 1, totalRounds: 10, currentStreak: 0, bestStreak: 0 }, round: { roundIndex: 0, scenarioId: 'scenario-1', action: 'pass', confidence: null, stakeAmount: 0, pnlAmount: 0, bankrollBefore: 10000, bankrollAfter: 10000, signalScoreDelta: 1, wasCorrect: null, companyGuess: null, companyGuessCorrect: null }, reveal: { scenarioId: 'scenario-1', companyName: 'Hidden Company', ticker: 'HID', outcomeLabel: '2020 to 2021', endingPrice: 13.5, actualReturnPercent: 0.35, shortText: 'That was Hidden Company.', funFact: null, whyItMoved: [], outcomeChart: [{ date: '2020-01-01', price: 12 }, { date: '2021-01-01', price: 13.5 }], smartPassEligible: true, smartPassExplanation: 'The evidence supported restraint before the outcome was known.' } };
  await page.route('**/api/runs/classic', (route) => route.fulfill(json({ run, context: { isAuthenticated: false, hasGuestSession: true } })));
  await page.route('**/api/runs/run-1/decisions', (route) => route.fulfill(json(result)));
  await page.goto('/play/classic/run?difficulty=easy');
  await expect(page.getByText('The evidence supported restraint before the outcome was known.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Pass' }).click();
  await page.getByRole('button', { name: 'Lock In' }).click();
  await expect(page.getByText('Smart Pass: +1 Signal')).toBeVisible();
  await expect(page.getByText(result.reveal.smartPassExplanation)).toBeVisible();
});

test('guest Classic keeps normalized private reveal behavior', async ({ page }) => {
  await page.unroute('**/api/**');
  const run = { id: 'run-normalized', mode: 'classic_run', difficulty: 'easy', status: 'in_progress', isOfficial: false, startingBankroll: 10000, currentBankroll: 10000, signalScore: 0, totalRounds: 10, completedRounds: 0, currentRoundIndex: 0, currentStreak: 0, bestStreak: 0, round: { roundIndex: 0, difficulty: 'easy', title: 'A Balanced Setup', decisionDateLabel: '2020', holdingPeriodLabel: 'One year', companyDescription: 'A company\u00e2\u20ac\u2122s growth story meets a real test.', macroContext: 'A shifting market.', situation: 'Demand and execution pull in different directions.', longCase: 'Execution could win.', shortCase: 'Competition could bite.', setupHints: [], lookbackChart: [{ date: '2019-01-01', price: 10 }, { date: '2020-01-01', price: 12 }] } };
  const result = { run: { id: 'run-normalized', status: 'in_progress', currentBankroll: 10350, signalScore: 1, completedRounds: 1, totalRounds: 10, currentStreak: 1, bestStreak: 1 }, round: { roundIndex: 0, scenarioId: 'scenario-1', action: 'long', confidence: 'low', stakeAmount: 1000, pnlAmount: 350, bankrollBefore: 10000, bankrollAfter: 10350, signalScoreDelta: 1, wasCorrect: true, companyGuess: null, companyGuessCorrect: null }, reveal: { scenarioId: 'scenario-1', companyName: 'Hidden Company', ticker: 'HID', outcomeLabel: '2020 to 2021', endingPrice: 13.5, actualReturnPercent: 0.35, shortText: 'That was Hidden Company. The company\u00e2\u20ac\u2122s execution paid off.', funFact: 'Its product reached more customers.', whyItMoved: ['Growth accelerated.'], outcomeChart: [{ date: '2020-01-01', price: 12 }, { date: '2021-01-01', price: 13.5 }], smartPassEligible: false, smartPassExplanation: 'A directional call was available.' } };
  await page.route('**/api/runs/classic', (route) => route.fulfill(json({ run, context: { isAuthenticated: false, hasGuestSession: true } })));
  await page.route('**/api/runs/run-normalized/decisions', (route) => route.fulfill(json(result)));
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

test('supporting states, preferences, reduced motion, and responsive landing remain available', async ({ page }) => {
  await page.goto('/play/classic'); await expect(page.getByRole('heading', { name: 'Classic Run' })).toBeVisible();
  await page.goto('/play/daily'); await expect(page.getByRole('heading', { name: 'Daily Challenge' })).toBeVisible();
  await page.goto('/profile'); await expect(page.getByRole('heading', { name: 'My Stats' })).toBeVisible();
  await page.goto('/settings'); const sound = page.getByRole('switch', { name: 'Reveal sounds' }); await sound.focus(); await expect(sound).toBeFocused(); await sound.press('Space'); const checked = await sound.getAttribute('aria-checked'); await page.reload(); await expect(page.getByRole('switch', { name: 'Reveal sounds' })).toHaveAttribute('aria-checked', checked ?? 'false');
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/'); await expect(page.getByRole('heading', { name: /Signal or Noise/ })).toBeVisible(); await page.goto('/settings'); await expect(page.getByText(/follows your device/)).toBeVisible();
  for (const width of [320, 375, 390, 768, 1024, 1440]) { await page.setViewportSize({ width, height: 900 }); await page.goto('/'); expect(await noOverflow(page)).toBe(true); }
});
