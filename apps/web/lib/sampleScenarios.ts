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
    actualReturnPercent: 11.356,
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
    title: 'Losing the Screen War',
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
    title: 'Growth at Any Cost',
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
      'Leadership preaches relentless customer obsession and pours every dollar back into growth.',
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
      'New leadership is pivoting toward cross-platform cloud services rather than defending its legacy desktop-software franchise.',
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
  {
    id: 'proto_cocacola_2010_2013',
    companyName: 'Coca-Cola',
    ticker: 'KO',
    acceptedNames: ['coca-cola', 'coca cola', 'coke', 'ko'],
    title: 'Steady Pour',
    era: 'Post-financial-crisis recovery',
    decisionDateLabel: 'Jan 2010',
    outcomeLabel: 'Jan 2010 \u2192 Jan 2013',
    holdingPeriodLabel: '3 years',
    actualReturnPercent: 0.28,
    companyDescription:
      'A global beverage giant with one of the most recognized product portfolios in the world, known for defensive, steady growth.',
    macroContext:
      'Markets are recovering from the financial crisis. Investors favor stable, dividend-paying consumer names over riskier bets.',
    clues: [
      'The company sells everyday consumer products with strong pricing power and enormous global distribution.',
      'Its appeal is stability and dividends, not explosive growth.',
      'Emerging-market demand is a key part of the long-term story.',
    ],
    revealShortText:
      'That was Coca-Cola. Steady demand and reliable dividends delivered a solid, low-drama gain.',
    funFact:
      'It has raised its dividend every year for over half a century, a favorite of income investors.',
    lookbackPrices: [20, 22, 25, 29, 21, 24, 26, 28],
    outcomePrices: [28, 29, 31, 30, 33, 34, 35, 36],
  },
  {
    id: 'proto_starbucks_2012_2014',
    companyName: 'Starbucks',
    ticker: 'SBUX',
    acceptedNames: ['starbucks', 'sbux'],
    title: 'Global Caffeine',
    era: 'Post-financial-crisis recovery',
    decisionDateLabel: 'Jan 2012',
    outcomeLabel: 'Jan 2012 \u2192 Jan 2014',
    holdingPeriodLabel: '2 years',
    actualReturnPercent: 0.52,
    companyDescription:
      'A premium coffee-and-cafe chain expanding aggressively worldwide with a loyal customer base.',
    macroContext:
      'Consumer spending is rebounding. Premium everyday-luxury brands are gaining traction, especially among younger urban customers.',
    clues: [
      'The company turns an everyday habit into a premium experience.',
      'Store count is growing fast, with big ambitions in Asia.',
      'A mobile app and loyalty program are becoming central to its strategy.',
    ],
    revealShortText:
      'That was Starbucks. Rapid store growth and a booming loyalty program powered a strong two-year run.',
    funFact:
      'Its loyalty program holds billions in prepaid customer balances \u2014 more than some banks.',
    lookbackPrices: [14, 16, 12, 18, 20, 22, 23, 24],
    outcomePrices: [24, 27, 29, 31, 33, 34, 36, 36.5],
  },
  {
    id: 'proto_nvidia_2015_2017',
    companyName: 'Nvidia',
    ticker: 'NVDA',
    acceptedNames: ['nvidia', 'nvda'],
    title: 'The Graphics Gamble',
    era: 'Cloud and AI acceleration',
    decisionDateLabel: 'Jan 2015',
    outcomeLabel: 'Jan 2015 \u2192 Jan 2017',
    holdingPeriodLabel: '2 years',
    actualReturnPercent: 2.30,
    companyDescription:
      'A chip designer known for high-performance processors used in gaming, now eyeing new computing markets.',
    macroContext:
      'Demand for parallel-processing hardware is rising as data centers, gaming, and early machine-learning workloads grow.',
    clues: [
      'Its core chips were built for gaming but turn out to be ideal for other heavy workloads.',
      'A new wave of computing demand could expand its market well beyond its origins.',
      'The stock has been volatile as investors debate whether the growth is real.',
    ],
    revealShortText:
      'That was Nvidia. Its gaming chips became the engine of the AI boom, and the stock more than tripled.',
    funFact:
      'Its graphics chips, once aimed at gamers, became the default hardware for training modern AI models.',
    lookbackPrices: [3, 3.5, 4, 4.2, 4, 4.5, 4.8, 5],
    outcomePrices: [5, 6, 7.5, 9, 11, 13, 15, 16.5],
  },
  {
    id: 'proto_ge_2016_2018',
    companyName: 'General Electric',
    ticker: 'GE',
    acceptedNames: ['general electric', 'ge'],
    title: 'The Conglomerate Cracks',
    era: 'Late-cycle industrial reckoning',
    decisionDateLabel: 'Jan 2016',
    outcomeLabel: 'Jan 2016 \u2192 Jan 2018',
    holdingPeriodLabel: '2 years',
    actualReturnPercent: -0.56,
    companyDescription:
      'A sprawling industrial conglomerate spanning power, aviation, and finance, long seen as a blue-chip staple.',
    macroContext:
      'Investors are questioning complex conglomerates. Hidden liabilities and weak cash flow are under new scrutiny.',
    clues: [
      'It is a decades-old blue chip spanning many unrelated businesses.',
      'Its dividend looks generous, but cash flow may not support it.',
      'New leadership is under pressure to simplify and cut.',
    ],
    revealShortText:
      'That was General Electric. Trouble in power and finance forced a historic dividend cut and a painful decline.',
    funFact:
      'It was removed from the Dow Jones Industrial Average in 2018 after more than a century in the index.',
    lookbackPrices: [22, 25, 27, 24, 28, 30, 31, 30],
    outcomePrices: [30, 29, 27, 24, 20, 17, 15, 13],
  },
  {
    id: 'proto_boeing_2013_2015',
    companyName: 'Boeing',
    ticker: 'BA',
    acceptedNames: ['boeing', 'ba'],
    title: 'Clear Skies, For Now',
    era: 'Post-financial-crisis recovery',
    decisionDateLabel: 'Jan 2013',
    outcomeLabel: 'Jan 2013 \u2192 Jan 2015',
    holdingPeriodLabel: '2 years',
    actualReturnPercent: 0.42,
    companyDescription:
      'One of two dominant makers of large commercial aircraft, with a massive multi-year order backlog.',
    macroContext:
      'Global air travel is expanding and airlines are ordering fuel-efficient jets, though supply chains are strained.',
    clues: [
      'It operates in a near-duopoly for large commercial jets.',
      'A record order backlog promises years of revenue if it can deliver.',
      'Early production hiccups on a new model rattled investors but were resolved.',
    ],
    revealShortText:
      'That was Boeing. A record jet backlog and smooth deliveries lifted the stock over 40% in two years.',
    funFact:
      'Its order backlog has at times exceeded 5,000 aircraft \u2014 many years of production.',
    lookbackPrices: [60, 62, 58, 65, 68, 70, 72, 75],
    outcomePrices: [75, 80, 88, 95, 100, 98, 104, 106],
  },
  {
    id: 'proto_visa_2011_2013',
    companyName: 'Visa',
    ticker: 'V',
    acceptedNames: ['visa', 'v'],
    title: 'Swipe Right',
    era: 'Post-financial-crisis recovery',
    decisionDateLabel: 'Jan 2011',
    outcomeLabel: 'Jan 2011 \u2192 Jan 2013',
    holdingPeriodLabel: '2 years',
    actualReturnPercent: 0.58,
    companyDescription:
      'A payments network that earns a small fee on a huge and growing volume of electronic transactions.',
    macroContext:
      'Cash is giving way to cards and digital payments worldwide, a durable multi-year shift.',
    clues: [
      "It doesn't lend money; it takes a tiny cut of a massive flow of transactions.",
      'The long-term tailwind is the global shift from cash to digital payments.',
      'Its network scale makes it very hard for newcomers to displace.',
    ],
    revealShortText:
      'That was Visa. The steady shift from cash to cards drove reliable, compounding growth.',
    funFact:
      'Its network can process tens of thousands of transactions per second \u2014 without ever touching the money itself.',
    lookbackPrices: [16, 17, 15, 18, 19, 20, 21, 22],
    outcomePrices: [22, 24, 26, 28, 30, 32, 34, 35],
  },
];

export function buildRunScenarioList(totalRounds: number): PrototypeScenario[] {
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
    if (lastEmitted && lap[0].id === lastEmitted.id) {
      // Swap with a random other position in the lap (1 .. lap.length-1)
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
