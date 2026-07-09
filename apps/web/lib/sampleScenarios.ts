// Loads Classic Run scenarios from the validated JSON content package (Phase 3).
// Sample seeds are prototype-grade (generatedByAi, not human-reviewed).

import { getActiveScenarios } from '@signal-or-noise/content';
import type { Scenario } from '@signal-or-noise/content';

export type HiddenCardVariant = {
  companyDescription: string;
  macroContext: string;
  situation: string;
  longCase: string;
  shortCase: string;
  setupHints: string[];
};

export type PrototypeScenario = {
  id: string;
  companyName: string;
  ticker: string;
  acceptedNames: string[];
  title: string;
  era: string;
  decisionDateLabel: string;
  outcomeLabel: string;
  holdingPeriodLabel: string;
  actualReturnPercent: number;
  hidden: {
    easy: HiddenCardVariant;
    medium: HiddenCardVariant;
    hard: HiddenCardVariant;
  };
  revealShortText: string;
  funFact: string;
  lookbackPrices: number[];
  outcomePrices: number[];
};

function mapVariant(
  variant: Scenario['hiddenCard']['easy'],
): HiddenCardVariant {
  return {
    companyDescription: variant.companyDescription,
    macroContext: variant.macroContext,
    situation: variant.situation,
    longCase: variant.longCase,
    shortCase: variant.shortCase,
    setupHints: [...variant.setupHints],
  };
}

export function mapScenarioToPrototype(scenario: Scenario): PrototypeScenario {
  return {
    id: scenario.id,
    companyName: scenario.company.name,
    ticker: scenario.company.ticker,
    acceptedNames: [...scenario.company.acceptedNames],
    title: scenario.scenario.title,
    era: scenario.scenario.era,
    decisionDateLabel: scenario.scenario.decisionDateLabel,
    outcomeLabel: scenario.scenario.outcomeLabel,
    holdingPeriodLabel: scenario.scenario.holdingPeriodLabel,
    actualReturnPercent: scenario.marketData.actualReturnPercent,
    hidden: {
      easy: mapVariant(scenario.hiddenCard.easy),
      medium: mapVariant(scenario.hiddenCard.medium),
      hard: mapVariant(scenario.hiddenCard.hard),
    },
    revealShortText: scenario.reveal.shortText,
    funFact: scenario.reveal.funFact,
    lookbackPrices: [...scenario.marketData.lookbackPrices],
    outcomePrices: [...scenario.marketData.outcomePrices],
  };
}

const SCENARIOS: PrototypeScenario[] = getActiveScenarios().map(
  mapScenarioToPrototype,
);

export function buildRunScenarioList(totalRounds: number): PrototypeScenario[] {
  if (SCENARIOS.length === 0) {
    return [];
  }

  const result: PrototypeScenario[] = [];
  let lastEmitted: PrototypeScenario | null = null;

  while (result.length < totalRounds) {
    const lap = [...SCENARIOS];
    // Fisher-Yates shuffle
    for (let i = lap.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lap[i], lap[j]] = [lap[j], lap[i]];
    }

    // Prevent boundary repeat: if the new lap starts with the last emitted card, swap it
    if (lastEmitted && lap.length > 1 && lap[0].id === lastEmitted.id) {
      const swapIdx = 1 + Math.floor(Math.random() * (lap.length - 1));
      [lap[0], lap[swapIdx]] = [lap[swapIdx], lap[0]];
    }

    for (const scenario of lap) {
      if (result.length >= totalRounds) break;
      result.push(scenario);
      lastEmitted = scenario;
    }
  }

  return result;
}
