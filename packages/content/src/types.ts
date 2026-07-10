export type ScenarioStatus =
  | 'draft'
  | 'reviewed'
  | 'active'
  | 'inactive'
  | 'archived';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type RecognitionBucket = 'famous' | 'moderate' | 'obscure';

export type ProductionScenarioInventoryEntry = {
  scenarioId: string;
  recognitionBucket: RecognitionBucket;
};

export type DailyChallengePoolEntry = {
  scenarioId: string;
  difficulty: Difficulty;
};

export type DailyChallengePool = {
  id: string;
  name: string;
  startingBankroll: number;
  scenarios: DailyChallengePoolEntry[];
};

export type MarketEra = {
  id: string;
  name: string;
  description: string;
};

export type Company = {
  name: string;
  ticker: string;
  exchange: string;
  sector: string;
  industry: string;
  country: string;
  acceptedNames: string[];
  identityBannedTerms: string[];
};

export type ScenarioMeta = {
  title: string;
  decisionDate: string;
  endDate: string;
  decisionDateLabel: string;
  outcomeLabel: string;
  holdingPeriodLabel: string;
  era: string;
  eraId: string;
  contentPackIds: string[];
  difficultySupported: Difficulty[];
};

export type MarketData = {
  startingPrice: number;
  endingPrice: number;
  /** Decimal return, e.g. +35% = 0.35, +1135.6% = 11.356 */
  actualReturnPercent: number;
  usesSplitAdjustedPrices: boolean;
  usesTotalReturn: boolean;
  preDecisionChartStartDate: string;
  preDecisionChartEndDate: string;
  outcomeChartStartDate: string;
  outcomeChartEndDate: string;
  lookbackPrices: number[];
  outcomePrices: number[];
};

export type HiddenCardVariant = {
  companyDescription: string;
  macroContext: string;
  situation: string;
  longCase: string;
  shortCase: string;
  setupHints: string[];
};

export type HiddenCard = {
  easy: HiddenCardVariant;
  medium: HiddenCardVariant;
  hard: HiddenCardVariant;
};

export type Reveal = {
  shortText: string;
  funFact: string;
  whyItMoved: [string, string, string];
};

export type ScenarioSource = {
  label: string;
  url: string;
  notes?: string;
};

export type FactBank = {
  revealOnly: string[];
  decisionUseful: string[];
  prohibited: string[];
  /** Optional Part B authoring metadata; existing prototype seeds may omit it. */
  peerSets?: {
    easy?: string[];
    medium?: string[];
    hard?: string[];
  };
  /** Identity-bearing combinations, including chart-plus-prose paths. */
  prohibitedConjunctions?: string[];
};

/** One model company guess from a Gate 2 judge run (raw, no verdict). */
export type Gate2Guess = {
  company: string;
  /** 0–100 confidence percentage. */
  confidence: number;
  pointingFact: string;
};

export type Gate2DirectionCall = 'long' | 'short' | 'toss_up';

export type Gate2DirectionResult = {
  call: Gate2DirectionCall;
  confidence: number;
  cue: string;
};

/**
 * Stored raw Gate 2 result for one difficulty variant.
 * Verdicts are recomputed offline — never stored.
 */
export type Gate2VariantResult = {
  payloadHash: string;
  model: string;
  promptVersion: string;
  testedAt: string;
  guesses: Gate2Guess[];
  direction: Gate2DirectionResult;
};

export type Gate2Review = {
  easy?: Gate2VariantResult;
  medium?: Gate2VariantResult;
  hard?: Gate2VariantResult;
};

export type Review = {
  generatedByAi: boolean;
  humanReviewed: boolean;
  reviewNotes: string;
  factBank: FactBank;
  easyLikelyGuesses: string[];
  mediumLikelyGuesses: string[];
  hardLikelyGuesses: string[];
  /** Optional stored Gate 2 raw results. Required by production phase acceptance. */
  gate2?: Gate2Review;
};

export type Scenario = {
  id: string;
  status: ScenarioStatus;
  company: Company;
  scenario: ScenarioMeta;
  marketData: MarketData;
  hiddenCard: HiddenCard;
  reveal: Reveal;
  sources: ScenarioSource[];
  review: Review;
};

export type ValidationIssue = {
  path: string;
  message: string;
};

export type ValidationWarning = {
  path: string;
  message: string;
};

export type ValidationResult =
  | { success: true; scenario: Scenario; warnings: ValidationWarning[] }
  | { success: false; errors: ValidationIssue[]; warnings: ValidationWarning[] };
