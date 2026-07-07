// PROTOTYPE PLACEHOLDER DATA (decision D006).
// Approximate returns, unverified. Replaced by curated content in Phase 3.

export type HiddenCardVariant = {
  companyDescription: string;
  macroContext: string;
  clues: string[]; // Easy 3, Medium 2, Hard 1 (D022)
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

const SCENARIOS: PrototypeScenario[] = [
  {
    id: 'proto_netflix_2012_2017',
    companyName: 'Netflix',
    ticker: 'NFLX',
    acceptedNames: ['netflix', 'nflx'],
    title: 'Trust Reset',
    era: 'Post-financial-crisis tech expansion',
    decisionDateLabel: 'Jan 2012',
    outcomeLabel: 'Jan 2012 \u2192 Jan 2017',
    holdingPeriodLabel: '5 years',
    actualReturnPercent: 11.356,
    hidden: {
      easy: {
        companyDescription:
          'A subscription entertainment company trying to move more of its customer experience online.',
        macroContext:
          'Broadband use, connected devices, and paid digital media habits are all expanding.',
        clues: [
          'The business earns recurring revenue from a large consumer audience.',
          'A recent pricing and strategy reset hurt trust, but the company still has room to scale if customers stay.',
          'Investors are debating whether faster online delivery can offset churn and rising content costs.',
        ],
      },
      medium: {
        companyDescription:
          'A consumer entertainment service with a recurring-revenue model.',
        macroContext:
          'Digital media consumption is rising, but investors are unsure which paid models will endure.',
        clues: [
          'The company is rebuilding credibility after a customer backlash over how it changed its offering.',
          'The long case is subscriber scale; the short case is churn, content spending, and weakened trust.',
        ],
      },
      hard: {
        companyDescription:
          'A consumer-facing media company.',
        macroContext:
          'Household internet habits are changing after the financial crisis.',
        clues: [
          'Management is pushing into a newer distribution model after a self-inflicted trust hit, creating a scale upside case but a real retention and spending risk.',
        ],
      },
    },
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
    title: 'Category Test',
    era: 'Smartphone platform era',
    decisionDateLabel: 'Jan 2007',
    outcomeLabel: 'Jan 2007 \u2192 Jul 2008',
    holdingPeriodLabel: '18 months',
    actualReturnPercent: 0.45,
    hidden: {
      easy: {
        companyDescription:
          'A consumer electronics company entering a fast-growing mobile-device category.',
        macroContext:
          'Mobile computing is moving beyond voice and text toward richer internet services.',
        clues: [
          'The company already has a loyal consumer base and strong design reputation.',
          'A new premium handheld product could open a larger platform, but carriers and entrenched device makers have the advantage.',
          'Investors are weighing high margins and brand pull against execution risk in an unfamiliar market.',
        ],
      },
      medium: {
        companyDescription:
          'A consumer hardware company expanding beyond its established device lineup.',
        macroContext:
          'The mobile market is being reshaped by data plans, better networks, and changing consumer expectations.',
        clues: [
          'The next move could turn the company into a broader platform, but it requires partners and users to adopt a new approach.',
          'The stock has momentum, leaving less room for a launch that disappoints on scale or profitability.',
        ],
      },
      hard: {
        companyDescription:
          'A consumer technology company.',
        macroContext:
          'Mobile usage is becoming more central to everyday computing.',
        clues: [
          'A strong consumer brand is making a category-expansion bet with major platform upside, while incumbents control distribution and the valuation already assumes strong execution.',
        ],
      },
    },
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
    title: 'Incumbent Pressure',
    era: 'Smartphone platform era',
    decisionDateLabel: 'Jun 2008',
    outcomeLabel: 'Jun 2008 \u2192 Jun 2010',
    holdingPeriodLabel: '2 years',
    actualReturnPercent: -0.52,
    hidden: {
      easy: {
        companyDescription:
          'A mobile communications company with deep business-customer relationships.',
        macroContext:
          'Mobile devices are becoming broader computing platforms as consumers demand richer software experiences.',
        clues: [
          'The company has a sticky professional user base and strong carrier relationships.',
          'Consumer-oriented rivals are resetting expectations faster than the incumbent can refresh its approach.',
          'The stock depends on whether enterprise loyalty and service revenue can offset pressure from newer platforms.',
        ],
      },
      medium: {
        companyDescription:
          'A communications-device company serving professional and consumer users.',
        macroContext:
          'Mobile computing is shifting from specialized devices toward broader software ecosystems.',
        clues: [
          'The incumbent is defending an established way of working as rivals make the category easier to adopt.',
          'A loyal customer base supports the long case, but the short case is that ecosystem momentum moves elsewhere.',
        ],
      },
      hard: {
        companyDescription:
          'A mobile technology company.',
        macroContext:
          'Consumer expectations for mobile computing are changing quickly.',
        clues: [
          'An enterprise-favored incumbent is relying on loyalty and service strengths while consumer-focused rivals reset the category and threaten future growth.',
        ],
      },
    },
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
    title: 'Peak Expectations',
    era: 'Dot-com bubble and aftermath',
    decisionDateLabel: 'Dec 1999',
    outcomeLabel: 'Dec 1999 \u2192 Sep 2001',
    holdingPeriodLabel: '~2 years',
    actualReturnPercent: -0.87,
    hidden: {
      easy: {
        companyDescription:
          'An internet retailer expanding quickly across consumer categories.',
        macroContext:
          'Internet valuations are peaking as investors start demanding proof of durable profits.',
        clues: [
          'Revenue is growing rapidly as more shoppers move online.',
          'The company is spending heavily on fulfillment, marketing, and expansion while losses mount.',
          'The stock has already run far ahead of current earnings, making a sentiment reversal dangerous.',
        ],
      },
      medium: {
        companyDescription:
          'An online commerce company growing faster than its profits.',
        macroContext:
          'The market is starting to separate internet businesses with real economics from pure speculation.',
        clues: [
          'The long case is that scale turns heavy spending into a lasting advantage.',
          'The short case is that cash burn and an inflated valuation become brutal when capital gets tighter.',
        ],
      },
      hard: {
        companyDescription:
          'An internet company.',
        macroContext:
          'Speculative growth stocks are under increasing scrutiny near the end of a market boom.',
        clues: [
          'A fast-growing online business is choosing scale over near-term profit, which could build a durable position or collapse if investors stop funding losses.',
        ],
      },
    },
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
    title: 'Old Platform New Bet',
    era: 'Cloud software expansion',
    decisionDateLabel: 'Jan 2014',
    outcomeLabel: 'Jan 2014 \u2192 Jan 2016',
    holdingPeriodLabel: '2 years',
    actualReturnPercent: 0.38,
    hidden: {
      easy: {
        companyDescription:
          'A mature enterprise software company shifting more of its business toward cloud subscriptions.',
        macroContext:
          'Businesses are moving more computing work from owned infrastructure to rented cloud services.',
        clues: [
          'The company has a large installed base and long-standing relationships with corporate customers.',
          'A cloud and subscription push could revive growth after years of investor frustration.',
          'The risk is that faster-growing rivals define the new market before the incumbent can reposition.',
        ],
      },
      medium: {
        companyDescription:
          'A large enterprise technology company with legacy software profits.',
        macroContext:
          'Cloud infrastructure and subscription pricing are changing how companies buy technology.',
        clues: [
          'The long case is distribution: existing business customers could make the transition easier.',
          'The short case is that mature cash cows may fade faster than newer cloud revenue can scale.',
        ],
      },
      hard: {
        companyDescription:
          'An enterprise technology company.',
        macroContext:
          'Corporate computing budgets are shifting toward hosted services.',
        clues: [
          'A mature incumbent is trying to turn a huge existing customer base into a subscription-growth engine, while faster rivals and legacy dependence threaten the transition.',
        ],
      },
    },
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
    title: 'Storefront Squeeze',
    era: 'Rate-hike / retail disruption era',
    decisionDateLabel: 'Jan 2016',
    outcomeLabel: 'Jan 2016 \u2192 Jan 2018',
    holdingPeriodLabel: '2 years',
    actualReturnPercent: -0.33,
    hidden: {
      easy: {
        companyDescription:
          'A specialty retailer tied to physical media, trade-ins, and mall traffic.',
        macroContext:
          'Consumers are buying more entertainment and software through digital channels instead of stores.',
        clues: [
          'The store base still throws off cash from loyal customers and resale activity.',
          'Publishers and platform owners are steering more purchases toward direct digital delivery.',
          'Investors are weighing a cheap valuation and cash flow against declining store relevance.',
        ],
      },
      medium: {
        companyDescription:
          'A specialty retailer exposed to the shift from physical purchases to digital delivery.',
        macroContext:
          'Retailers with store-heavy models are under pressure as online and direct channels gain share.',
        clues: [
          'The long case is cash flow from an existing customer base; the short case is that the core transaction keeps moving away from stores.',
          'A low valuation offers support only if management can find a credible path beyond the old model.',
        ],
      },
      hard: {
        companyDescription:
          'A consumer retail company.',
        macroContext:
          'Store-based retailers are being tested by digital distribution and changing shopper habits.',
        clues: [
          'A cash-generative store network is facing a direct-channel shift that could either be managed from a cheap valuation or steadily erode the core business.',
        ],
      },
    },
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
    title: 'Defensive Compounder',
    era: 'Post-financial-crisis recovery',
    decisionDateLabel: 'Jan 2010',
    outcomeLabel: 'Jan 2010 \u2192 Jan 2013',
    holdingPeriodLabel: '3 years',
    actualReturnPercent: 0.28,
    hidden: {
      easy: {
        companyDescription:
          'A global nonalcoholic beverage company with broad distribution and repeat purchases.',
        macroContext:
          'Markets are recovering from the financial crisis, and investors are still paying attention to stable cash flows.',
        clues: [
          'The company sells everyday products with strong brand recognition and pricing power.',
          'Emerging-market volume growth could add to a steady mature-market base.',
          'The short case is that defensive stocks may lag if investors rotate into faster growth.',
        ],
      },
      medium: {
        companyDescription:
          'A global consumer staples company built around repeat purchases.',
        macroContext:
          'After the crisis, investors are balancing safety, dividends, and renewed appetite for risk.',
        clues: [
          'The long case is durable demand, pricing power, and international volume growth.',
          'The short case is limited excitement if the recovery rewards more cyclical companies.',
        ],
      },
      hard: {
        companyDescription:
          'A consumer staples company.',
        macroContext:
          'The market is moving from crisis recovery toward a more normal risk appetite.',
        clues: [
          'A defensive cash generator offers brand strength and global demand, but its steady profile could underperform if investors chase higher-growth recovery stories.',
        ],
      },
    },
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
    title: 'Habit Becomes Scale',
    era: 'Post-financial-crisis recovery',
    decisionDateLabel: 'Jan 2012',
    outcomeLabel: 'Jan 2012 \u2192 Jan 2014',
    holdingPeriodLabel: '2 years',
    actualReturnPercent: 0.52,
    hidden: {
      easy: {
        companyDescription:
          'A premium cafe chain turning a daily habit into a global consumer brand.',
        macroContext:
          'Consumer spending is recovering, and urban middle-class demand is rising in several international markets.',
        clues: [
          'The company has loyal repeat customers and room to open more stores.',
          'International expansion and a growing rewards program could make sales more predictable.',
          'The risk is that rapid expansion and premium pricing disappoint if consumer spending softens.',
        ],
      },
      medium: {
        companyDescription:
          'A premium consumer-service chain with repeat daily visits.',
        macroContext:
          'Post-crisis consumers are selectively returning to affordable indulgences.',
        clues: [
          'The long case is store growth plus loyalty-driven repeat spending.',
          'The short case is that expansion costs and premium positioning leave little room for weaker traffic.',
        ],
      },
      hard: {
        companyDescription:
          'A consumer brand with a store-based model.',
        macroContext:
          'Consumer spending is improving but still sensitive to confidence and employment trends.',
        clues: [
          'A repeat-purchase brand is expanding its footprint and loyalty economics, while premium pricing and fast growth create execution risk.',
        ],
      },
    },
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
    title: 'Specialized Hardware Test',
    era: 'Cloud and AI acceleration',
    decisionDateLabel: 'Jan 2015',
    outcomeLabel: 'Jan 2015 \u2192 Jan 2017',
    holdingPeriodLabel: '2 years',
    actualReturnPercent: 2.3,
    hidden: {
      easy: {
        companyDescription:
          'A specialized chip designer whose high-performance hardware serves enthusiasts and commercial computing buyers.',
        macroContext:
          'Cloud platforms and data-heavy workloads are increasing demand for specialized processing power.',
        clues: [
          'The company has a strong niche in performance-focused computing hardware.',
          'New commercial workloads could expand demand beyond its original enthusiast market.',
          'The risk is that a cyclical chip market and volatile expectations make the growth story easy to overprice.',
        ],
      },
      medium: {
        companyDescription:
          'A semiconductor company focused on specialized high-performance processors.',
        macroContext:
          'Data centers are experimenting with more purpose-built hardware for heavy computing tasks.',
        clues: [
          'The long case is that a niche hardware category becomes useful for larger commercial workloads.',
          'The short case is that chip cycles and competition turn early demand into a temporary spike.',
        ],
      },
      hard: {
        companyDescription:
          'A semiconductor company.',
        macroContext:
          'Computing demand is broadening as cloud infrastructure grows.',
        clues: [
          'A specialized hardware supplier may see its niche expand into larger computing markets, but cyclical demand and fast-moving rivals make the valuation risky.',
        ],
      },
    },
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
    title: 'Blue-Chip Stress Test',
    era: 'Late-cycle industrial reckoning',
    decisionDateLabel: 'Jan 2016',
    outcomeLabel: 'Jan 2016 \u2192 Jan 2018',
    holdingPeriodLabel: '2 years',
    actualReturnPercent: -0.56,
    hidden: {
      easy: {
        companyDescription:
          'A diversified industrial conglomerate with exposure to equipment, services, and financial obligations.',
        macroContext:
          'Late-cycle industrial companies are facing pressure from weak demand, complex balance sheets, and investor calls for focus.',
        clues: [
          'The company still carries a blue-chip reputation and a generous shareholder payout.',
          'Cash flow is under pressure, making that payout and the corporate structure harder to defend.',
          'The long case is simplification and asset sales; the short case is that hidden liabilities overwhelm the plan.',
        ],
      },
      medium: {
        companyDescription:
          'A diversified industrial company with many business lines.',
        macroContext:
          'Investors are questioning complex companies that are hard to value late in the cycle.',
        clues: [
          'A respected payout and old blue-chip status support the stock, but cash generation is not keeping up.',
          'The company may unlock value by simplifying, or reveal deeper problems as scrutiny rises.',
        ],
      },
      hard: {
        companyDescription:
          'An industrial company.',
        macroContext:
          'Late-cycle markets are less forgiving toward complex balance sheets.',
        clues: [
          'A once-trusted incumbent is leaning on reputation and shareholder payouts while weak cash flow and complexity raise the risk of a painful reset.',
        ],
      },
    },
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
    title: 'Backlog or Bottleneck',
    era: 'Post-financial-crisis recovery',
    decisionDateLabel: 'Jan 2013',
    outcomeLabel: 'Jan 2013 \u2192 Jan 2015',
    holdingPeriodLabel: '2 years',
    actualReturnPercent: 0.42,
    hidden: {
      easy: {
        companyDescription:
          'A large aerospace manufacturer with commercial and defense customers.',
        macroContext:
          'Global travel demand is improving, and airlines are ordering more fuel-efficient equipment.',
        clues: [
          'A large order backlog could support years of revenue.',
          'Production issues on a newer program have worried investors, but delivery progress could restore confidence.',
          'The risk is that supply-chain strain or customer delays turn the backlog into a bottleneck.',
        ],
      },
      medium: {
        companyDescription:
          'An aerospace and defense manufacturer with long-cycle production programs.',
        macroContext:
          'Air travel and capital spending are recovering, but industrial supply chains remain sensitive.',
        clues: [
          'The long case is a deep backlog tied to fuel-efficiency demand.',
          'The short case is that production problems and delivery delays eat into expected cash flow.',
        ],
      },
      hard: {
        companyDescription:
          'An industrial manufacturer.',
        macroContext:
          'The recovery is reviving capital spending, but long supply chains remain fragile.',
        clues: [
          'A long-cycle manufacturer has strong demand visibility from backlog, while execution problems could convert that visibility into delays and margin pressure.',
        ],
      },
    },
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
    title: 'Rails of Commerce',
    era: 'Post-financial-crisis recovery',
    decisionDateLabel: 'Jan 2011',
    outcomeLabel: 'Jan 2011 \u2192 Jan 2013',
    holdingPeriodLabel: '2 years',
    actualReturnPercent: 0.58,
    hidden: {
      easy: {
        companyDescription:
          'A fee-based financial infrastructure company that benefits as more commerce becomes electronic.',
        macroContext:
          'Consumers and merchants are moving more transactions away from cash and checks.',
        clues: [
          'The company earns from transaction volume rather than lending money itself.',
          'Global adoption of electronic payments creates a durable growth tailwind.',
          'The risk is regulation, merchant pressure, or rivals compressing fees on a high-margin network.',
        ],
      },
      medium: {
        companyDescription:
          'A financial infrastructure company tied to payment volume.',
        macroContext:
          'Electronic commerce is becoming more common across households and businesses.',
        clues: [
          'The long case is toll-like economics as transaction volume grows without taking direct credit risk.',
          'The short case is that regulation and large customers push back on fees.',
        ],
      },
      hard: {
        companyDescription:
          'A financial infrastructure company.',
        macroContext:
          'Commerce is becoming more digital during the post-crisis recovery.',
        clues: [
          'A fee-based network can compound as transaction volumes migrate electronically, but regulation and customer pushback could pressure its economics.',
        ],
      },
    },
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
