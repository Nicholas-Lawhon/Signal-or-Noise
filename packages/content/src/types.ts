export type ScenarioStatus =
  | 'draft'
  | 'reviewed'
  | 'active'
  | 'inactive'
  | 'archived';

export type Difficulty = 'easy' | 'medium' | 'hard';

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
};

export type Review = {
  generatedByAi: boolean;
  humanReviewed: boolean;
  reviewNotes: string;
  factBank: FactBank;
  easyLikelyGuesses: string[];
  mediumLikelyGuesses: string[];
  hardLikelyGuesses: string[];
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
