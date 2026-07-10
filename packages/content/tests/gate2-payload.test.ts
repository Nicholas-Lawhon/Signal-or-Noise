import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  canonicalJson,
  hashVariantPayload,
  normalizeLookbackPrices,
  renderVariantPayload,
  sha256Hex,
} from '../src/gate2/payload';
import type { Scenario } from '../src/types';

function loadActiveNetflix(): Scenario {
  const path = resolve(
    __dirname,
    '../scenarios/archived/scenario_netflix_2012_2017.json',
  );
  return JSON.parse(readFileSync(path, 'utf8')) as Scenario;
}

function cloneScenario(scenario: Scenario): Scenario {
  return JSON.parse(JSON.stringify(scenario)) as Scenario;
}

describe('normalizeLookbackPrices', () => {
  it('indexes first value to 100 with one decimal', () => {
    expect(normalizeLookbackPrices([10, 15, 5])).toEqual([100, 150, 50]);
    expect(normalizeLookbackPrices([5.5, 6.8, 9.2, 14.5])).toEqual([
      100, 123.6, 167.3, 263.6,
    ]);
  });

  it('returns empty for empty input', () => {
    expect(normalizeLookbackPrices([])).toEqual([]);
  });
});

describe('renderVariantPayload', () => {
  it('includes exactly pre-decision fields for the chosen difficulty', () => {
    const scenario = loadActiveNetflix();
    const payload = renderVariantPayload(scenario, 'easy');

    expect(payload).toEqual({
      title: scenario.scenario.title,
      era: scenario.scenario.era,
      decisionDateLabel: scenario.scenario.decisionDateLabel,
      holdingPeriodLabel: scenario.scenario.holdingPeriodLabel,
      companyDescription: scenario.hiddenCard.easy.companyDescription,
      macroContext: scenario.hiddenCard.easy.macroContext,
      situation: scenario.hiddenCard.easy.situation,
      longCase: scenario.hiddenCard.easy.longCase,
      shortCase: scenario.hiddenCard.easy.shortCase,
      setupHints: scenario.hiddenCard.easy.setupHints,
      lookbackPrices: normalizeLookbackPrices(
        scenario.marketData.lookbackPrices,
      ),
    });
  });

  it('excludes company identity, reveal, outcome, sources, and review fields', () => {
    const scenario = loadActiveNetflix();
    const payload = renderVariantPayload(scenario, 'hard');
    const json = JSON.stringify(payload);

    expect(json).not.toContain(scenario.company.name);
    expect(json).not.toContain(scenario.company.ticker);
    expect(json).not.toContain(scenario.reveal.shortText);
    expect(json).not.toContain(scenario.reveal.funFact);
    expect(json).not.toContain('outcomeLabel');
    expect(json).not.toContain('endingPrice');
    expect(json).not.toContain('actualReturnPercent');
    expect(json).not.toContain('outcomePrices');
    expect(json).not.toContain(scenario.sources[0]?.url ?? 'http');
    expect(json).not.toContain('gate2');
    expect(json).not.toContain('factBank');

    // Shape must not expose forbidden keys
    const keys = Object.keys(payload).sort();
    expect(keys).toEqual(
      [
        'companyDescription',
        'decisionDateLabel',
        'era',
        'holdingPeriodLabel',
        'longCase',
        'lookbackPrices',
        'macroContext',
        'setupHints',
        'shortCase',
        'situation',
        'title',
      ].sort(),
    );
  });

  it('uses difficulty-specific hidden-card fields', () => {
    const scenario = loadActiveNetflix();
    const easy = renderVariantPayload(scenario, 'easy');
    const hard = renderVariantPayload(scenario, 'hard');
    expect(easy.setupHints).toHaveLength(1);
    expect(hard.setupHints).toHaveLength(0);
    expect(easy.companyDescription).not.toBe(hard.companyDescription);
  });
});

describe('sha256Hex (browser-safe, no node:crypto)', () => {
  it('matches the known SHA-256 vector for "abc"', () => {
    // FIPS 180-4 / NIST known answer test
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('matches empty-string known vector', () => {
    expect(sha256Hex('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });
});

describe('hashVariantPayload', () => {
  it('returns sha256:<64 lowercase hex> via pure helper path', () => {
    const scenario = loadActiveNetflix();
    const hash = hashVariantPayload(renderVariantPayload(scenario, 'easy'));
    expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    // Same digest as hashing the canonical JSON string directly
    const payload = renderVariantPayload(scenario, 'easy');
    expect(hash).toBe(`sha256:${sha256Hex(canonicalJson(payload))}`);
  });

  it('is stable for the same payload', () => {
    const scenario = loadActiveNetflix();
    const payload = renderVariantPayload(scenario, 'medium');
    const a = hashVariantPayload(payload);
    const b = hashVariantPayload(payload);
    expect(a).toBe(b);
    expect(a).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it('changes when pre-decision content changes', () => {
    const scenario = loadActiveNetflix();
    const base = hashVariantPayload(renderVariantPayload(scenario, 'easy'));

    const titleEdit = cloneScenario(scenario);
    titleEdit.scenario.title = 'A Different Title';
    expect(
      hashVariantPayload(renderVariantPayload(titleEdit, 'easy')),
    ).not.toBe(base);

    const hintEdit = cloneScenario(scenario);
    hintEdit.hiddenCard.easy.setupHints = ['Completely different setup hint.'];
    expect(
      hashVariantPayload(renderVariantPayload(hintEdit, 'easy')),
    ).not.toBe(base);

    const lookbackEdit = cloneScenario(scenario);
    lookbackEdit.marketData.lookbackPrices = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(
      hashVariantPayload(renderVariantPayload(lookbackEdit, 'easy')),
    ).not.toBe(base);
  });

  it('is unchanged when only reveal-side fields change', () => {
    const scenario = loadActiveNetflix();
    const base = hashVariantPayload(renderVariantPayload(scenario, 'hard'));

    const revealEdit = cloneScenario(scenario);
    revealEdit.reveal.shortText = 'Totally different reveal copy.';
    revealEdit.reveal.funFact = 'Different fun fact.';
    revealEdit.company.name = 'NotNetflix';
    revealEdit.company.ticker = 'XXXX';
    revealEdit.company.acceptedNames = ['other'];
    revealEdit.marketData.endingPrice = 999;
    revealEdit.marketData.actualReturnPercent = 0.5;
    revealEdit.marketData.outcomePrices = [1, 2, 3];
    revealEdit.scenario.outcomeLabel = 'Different outcome window';
    revealEdit.sources = [
      { label: 'x', url: 'https://example.com/other', notes: 'n' },
    ];
    revealEdit.review.reviewNotes = 'Edited notes';
    revealEdit.review.easyLikelyGuesses = ['Someone Else'];

    expect(
      hashVariantPayload(renderVariantPayload(revealEdit, 'hard')),
    ).toBe(base);
  });

  it('canonicalJson sorts object keys for stable hashing', () => {
    const a = canonicalJson({ b: 1, a: 2 });
    const b = canonicalJson({ a: 2, b: 1 });
    expect(a).toBe(b);
    expect(a).toBe('{"a":2,"b":1}');
  });
});
