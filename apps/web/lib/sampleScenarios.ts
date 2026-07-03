// PROTOTYPE PLACEHOLDER DATA (decision D006).
// Approximate returns, unverified. Replaced by curated content in Phase 3.

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
  companyDescription: string;
  macroContext: string;
  clues: [string, string, string];
  revealShortText: string;
  funFact: string;
  lookbackPrices: number[];
  outcomePrices: number[];
};

const SCENARIOS: PrototypeScenario[] = [
  {
    id: 'proto_netflix_2012_2017',
    companyName: 'Netflix',
    ticker: 'NFLX',
    acceptedNames: ['netflix', 'nflx'],
    title: 'The Streaming Pivot',
    era: 'Post-financial-crisis tech expansion',
    decisionDateLabel: 'Jan 2012',
    outcomeLabel: 'Jan 2012 \u2192 Jan 2017',
    holdingPeriodLabel: '5 years',
    actualReturnPercent: 11.36,
    companyDescription:
      'A U.S. entertainment company with a recurring-revenue model and a controversial strategic transition.',
    macroContext:
      'Broadband adoption is rising while consumer tech platforms are becoming more important.',
    clues: [
      'The company is moving from a legacy model into a digital-first future.',
      'Recent management decisions damaged investor trust.',
      'The upside case depends on scale and recurring customer growth.',
    ],
    revealShortText:
      'That was Netflix. The market was skeptical, but streaming adoption exploded.',
    funFact:
      'The company\u2019s transition looked risky at the time, but it became one of the defining consumer-tech winners of the decade.',
    lookbackPrices: [5.5, 6.8, 9.2, 14.5, 25.1, 42.7, 30.9, 10.3],
    outcomePrices: [10.3, 13.2, 25.4, 48.8, 62.5, 98.1, 110.4, 127.5],
  },
  {
    id: 'proto_apple_2007_2008',
    companyName: 'Apple',
    ticker: 'AAPL',
    acceptedNames: ['apple', 'apple inc', 'aapl'],
    title: 'The Pocket Computer Bet',
    era: 'Smartphone platform era',
    decisionDateLabel: 'Jan 2007',
    outcomeLabel: 'Jan 2007 \u2192 Jul 2008',
    holdingPeriodLabel: '18 months',
    actualReturnPercent: 0.45,
    companyDescription:
      'A consumer electronics company betting its future on a new category of mobile device.',
    macroContext:
      'The mobile industry is shifting from feature phones to internet-connected touchscreen devices.',
    clues: [
      'The company is about to launch a device that redefines an entire product category.',
      'Competitors are skeptical, citing hardware margins and lack of a physical keyboard.',
      'Success hinges on developer adoption and a new ecosystem of third-party applications.',
    ],
    revealShortText:
      'That was Apple. The iPhone launch quickly reframed the company as a mobile platform contender.',
    funFact:
      'Apple sold over 6 million first-generation iPhones, but the App Store launched a year later is what truly unlocked the platform.',
    lookbackPrices: [1.2, 1.7, 2.4, 2.9, 3.1, 2.6, 3.0, 3.4],
    outcomePrices: [3.4, 3.8, 4.4, 5.6, 6.1, 5.2, 4.6, 4.9],
  },
  {
    id: 'proto_blackberry_2008_2010',
    companyName: 'BlackBerry',
    ticker: 'BBRY',
    acceptedNames: ['blackberry', 'rim', 'research in motion', 'bbry'],
    title: 'The Keyboard King',
    era: 'Smartphone platform era',
    decisionDateLabel: 'Jun 2008',
    outcomeLabel: 'Jun 2008 \u2192 Jun 2010',
    holdingPeriodLabel: '2 years',
    actualReturnPercent: -0.52,
    companyDescription:
      'A mobile communications company that once dominated the smartphone market with its physical keyboard devices.',
    macroContext:
      'Touchscreen smartphones are gaining share rapidly, threatening keyboard-centric designs.',
    clues: [
      'The company owns a massive enterprise user base but is slow to adopt a new interface paradigm.',
      'A rival platform\u2019s app ecosystem is growing exponentially in both consumer and business markets.',
      'The company believes its security and messaging strengths will be enough of a moat.',
    ],
    revealShortText:
      'That was BlackBerry. The touchscreen revolution swept past its keyboard empire.',
    funFact:
      'At its peak in 2009, BlackBerry held over 20% of the global smartphone market share and was known as the CrackBerry for its addictive messaging.',
    lookbackPrices: [8, 11, 16, 24, 39, 61, 70, 68],
    outcomePrices: [68, 60, 48, 41, 55, 47, 38, 33],
  },
  {
    id: 'proto_amazon_1999_2001',
    companyName: 'Amazon',
    ticker: 'AMZN',
    acceptedNames: ['amazon', 'amazon.com', 'amzn'],
    title: 'Everything Store, Everything Crash',
    era: 'Dot-com bubble and aftermath',
    decisionDateLabel: 'Dec 1999',
    outcomeLabel: 'Dec 1999 \u2192 Sep 2001',
    holdingPeriodLabel: '~2 years',
    actualReturnPercent: -0.87,
    companyDescription:
      'An online retailer that sold everything from books to electronics, growing fast but burning cash.',
    macroContext:
      'The dot-com bubble is peaking. Valuations for internet companies have soared, but investors are questioning whether any of them can become profitable.',
    clues: [
      'The company has a visionary founder who promises to build the world\u2019s most customer-centric company.',
      'Revenue is doubling, but losses are also mounting, and the stock has already risen dramatically.',
      'Market sentiment is shifting from growth-at-all-costs to a focus on near-term profitability.',
    ],
    revealShortText:
      'That was Amazon. The dot-com crash wiped out most of its market value, but it survived to become one of the most valuable companies in the world.',
    funFact:
      'Amazon stock fell from $107 to $7 a share during the dot-com bust, a 93% decline.',
    lookbackPrices: [2, 4, 7, 15, 28, 45, 62, 76],
    outcomePrices: [76, 64, 41, 30, 18, 12, 8, 10],
  },
  {
    id: 'proto_microsoft_2014_2016',
    companyName: 'Microsoft',
    ticker: 'MSFT',
    acceptedNames: ['microsoft', 'msft'],
    title: 'The Sleeping Giant',
    era: 'Cloud software expansion',
    decisionDateLabel: 'Jan 2014',
    outcomeLabel: 'Jan 2014 \u2192 Jan 2016',
    holdingPeriodLabel: '2 years',
    actualReturnPercent: 0.38,
    companyDescription:
      'A legacy software giant attempting to reinvent itself under new leadership after missing the mobile wave.',
    macroContext:
      'Cloud computing is reshaping enterprise IT, with businesses shifting from on-premise servers to subscription-based cloud services.',
    clues: [
      'The company\u2019s new CEO is pivoting strategy toward cross-platform cloud services rather than protecting legacy Windows revenue.',
      'The stock has been flat for over a decade, and many investors consider the company a value trap.',
      'Its enterprise relationships and existing customer base could become a distribution advantage for a new subscription business.',
    ],
    revealShortText:
      'That was Microsoft. The cloud pivot under Satya Nadella started changing how investors valued the old software giant.',
    funFact:
      'By early 2016, the market had started rewarding the company for cloud growth and recurring software revenue.',
    lookbackPrices: [26, 25, 27, 28, 30, 32, 34, 37],
    outcomePrices: [37, 40, 44, 47, 43, 46, 49, 51],
  },
  {
    id: 'proto_gamestop_2016_2018',
    companyName: 'GameStop',
    ticker: 'GME',
    acceptedNames: ['gamestop', 'gme'],
    title: 'Game Over for Retail?',
    era: 'Rate-hike / retail disruption era',
    decisionDateLabel: 'Jan 2016',
    outcomeLabel: 'Jan 2016 \u2192 Jan 2018',
    holdingPeriodLabel: '2 years',
    actualReturnPercent: -0.33,
    companyDescription:
      'A brick-and-mortar video game retailer facing a generational shift in how consumers buy games.',
    macroContext:
      'Digital downloads are replacing physical game discs. Console manufacturers are pushing direct-to-consumer digital storefronts.',
    clues: [
      'The company still generates significant cash flow from its physical store network.',
      'Game publishers are increasingly incentivizing digital purchases over physical copies.',
      'The company has no clear strategy to pivot its 5,000+ store footprint into a digital future.',
    ],
    revealShortText:
      'That was GameStop. Digital disruption kept pressuring the store network years before the meme-stock frenzy of 2021.',
    funFact:
      'The physical game resale model was still cash-generative, but digital downloads were steadily eroding the moat.',
    lookbackPrices: [22, 30, 38, 42, 36, 30, 28, 28],
    outcomePrices: [28, 26, 24, 25, 22, 21, 19, 19],
  },
];

export function buildRunScenarioList(totalRounds: number): PrototypeScenario[] {
  const shuffled = [...SCENARIOS];
  // Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const result: PrototypeScenario[] = [];
  for (let i = 0; i < totalRounds; i++) {
    result.push(shuffled[i % shuffled.length]);
  }
  return result;
}
