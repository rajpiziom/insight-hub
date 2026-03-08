import type { Source, Article, TopicCluster, ArticleSummary, TopicComparison, DailyBriefing, ChatSession, ChatMessage } from '@/types';

export const mockSources: Source[] = [
  { id: 's1', user_id: 'u1', name: 'Bloomberg', type: 'api', base_url: 'https://bloomberg.com', topic_tags: ['markets', 'business', 'macro'], is_active: true, priority: 1, last_sync_at: '2026-03-08T06:00:00Z', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-03-08T06:00:00Z' },
  { id: 's2', user_id: 'u1', name: 'Financial Times', type: 'rss', base_url: 'https://ft.com', topic_tags: ['markets', 'geopolitics', 'business'], is_active: true, priority: 1, last_sync_at: '2026-03-08T05:30:00Z', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-03-08T05:30:00Z' },
  { id: 's3', user_id: 'u1', name: 'Reuters', type: 'rss', base_url: 'https://reuters.com', topic_tags: ['markets', 'geopolitics', 'macro'], is_active: true, priority: 2, last_sync_at: '2026-03-08T05:45:00Z', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-03-08T05:45:00Z' },
  { id: 's4', user_id: 'u1', name: 'TechCrunch', type: 'rss', base_url: 'https://techcrunch.com', topic_tags: ['technology', 'business'], is_active: true, priority: 3, last_sync_at: '2026-03-08T04:00:00Z', created_at: '2026-01-15T00:00:00Z', updated_at: '2026-03-08T04:00:00Z' },
  { id: 's5', user_id: 'u1', name: 'The Economist', type: 'api', base_url: 'https://economist.com', topic_tags: ['macro', 'geopolitics', 'business'], is_active: true, priority: 2, last_sync_at: '2026-03-07T22:00:00Z', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-03-07T22:00:00Z' },
  { id: 's6', user_id: 'u1', name: 'WSJ', type: 'rss', base_url: 'https://wsj.com', topic_tags: ['markets', 'business', 'macro'], is_active: false, priority: 2, last_sync_at: '2026-03-06T12:00:00Z', created_at: '2026-02-01T00:00:00Z', updated_at: '2026-03-06T12:00:00Z' },
];

export const mockArticles: Article[] = [
  {
    id: 'a1', user_id: 'u1', source_id: 's1', source_name: 'Bloomberg',
    title: 'Federal Reserve Signals Potential Rate Cut in Q2 Amid Slowing Growth',
    author: 'Jennifer Hughes', published_at: '2026-03-08T08:30:00Z', url: 'https://bloomberg.com/article/1',
    full_text: `The Federal Reserve signaled on Friday that it may begin cutting interest rates as early as Q2 2026, as recent economic data points to a significant slowdown in growth across multiple sectors.\n\nFed Chair Jerome Powell, speaking at a press conference following the latest FOMC meeting, noted that "the balance of risks has shifted" and that the committee is "closely monitoring incoming data for signs that a policy adjustment may be warranted."\n\nThe statement marks a notable shift from the Fed's previously hawkish stance, which had kept rates elevated for over two years. Markets responded positively, with the S&P 500 rising 1.2% and Treasury yields falling sharply across the curve.\n\nEconomists at Goldman Sachs and JPMorgan have both revised their rate forecasts, now expecting a 25 basis point cut at the June meeting, with a further 50 basis points of cuts by year-end.\n\n"This is the clearest signal yet that the Fed is preparing to pivot," said Mark Cabana, head of US rates strategy at Bank of America. "The question now is whether the economy slows fast enough to justify a more aggressive cutting cycle."\n\nKey data points cited by Powell include softening consumer spending, a cooling labor market with unemployment ticking up to 4.1%, and declining manufacturing activity. However, he cautioned that inflation, while moderating, remains above the 2% target at 2.8%.`,
    image_url: null, topic_tags: ['macro', 'markets', 'fed'], cluster_id: 'c1',
    sentiment: 'neutral', is_read: false, is_bookmarked: false,
    created_at: '2026-03-08T08:30:00Z', updated_at: '2026-03-08T08:30:00Z',
  },
  {
    id: 'a2', user_id: 'u1', source_id: 's2', source_name: 'Financial Times',
    title: 'Fed Pivot: Markets Rally as Powell Hints at Rate Cuts',
    author: 'Colby Smith', published_at: '2026-03-08T09:00:00Z', url: 'https://ft.com/article/2',
    full_text: `Financial markets surged on Friday after Federal Reserve chair Jay Powell delivered his strongest signal yet that rate cuts are on the horizon.\n\nIn a shift that caught some analysts off guard, Powell acknowledged that the US economy is entering "a new phase" characterised by slower growth and a gradually cooling labour market.\n\nThe dollar fell against major currencies, while gold rallied to a new high above $2,850 per ounce. European markets also responded positively, with the FTSE 100 and Euro Stoxx 50 both rising more than 0.8%.\n\nHowever, the FT understands that divisions remain within the FOMC, with several regional Fed presidents expressing concern that cutting rates too soon could reignite inflation. One voting member described the decision framework as "finely balanced."\n\nThe shift also has implications for emerging markets, where dollar-denominated debt has been under pressure from high US rates. A Fed pivot could provide significant relief to economies in Latin America and Southeast Asia.\n\n"The Fed is walking a tightrope," said Karen Ward, chief market strategist at JPMorgan Asset Management. "They need to ease financial conditions without losing credibility on their inflation mandate."`,
    image_url: null, topic_tags: ['macro', 'markets', 'fed'], cluster_id: 'c1',
    sentiment: 'positive', is_read: true, is_bookmarked: true,
    created_at: '2026-03-08T09:00:00Z', updated_at: '2026-03-08T09:00:00Z',
  },
  {
    id: 'a3', user_id: 'u1', source_id: 's3', source_name: 'Reuters',
    title: 'Fed Holds Rates Steady But Opens Door to Cuts',
    author: 'Howard Schneider', published_at: '2026-03-08T07:15:00Z', url: 'https://reuters.com/article/3',
    full_text: `WASHINGTON (Reuters) - The Federal Reserve held its benchmark interest rate steady on Friday but signaled it could begin cutting rates in the coming months, citing a deteriorating economic outlook.\n\nThe central bank kept the federal funds rate in the 5.25%-5.50% range, as widely expected, but removed key language from its statement that had previously emphasized the need for "further tightening."\n\nIn the new statement, the Fed said it would be "attentive to risks on both sides of its mandate," a formulation that economists interpreted as laying the groundwork for rate reductions.\n\nU.S. Treasury yields fell sharply in response, with the 2-year note dropping 15 basis points to 4.35%. The S&P 500 closed 1.2% higher, while the Nasdaq gained 1.5%.\n\nThe Fed's dot plot, released alongside the statement, showed that a majority of FOMC members now expect at least two rate cuts by the end of 2026, up from one in the previous projection.`,
    image_url: null, topic_tags: ['macro', 'markets', 'fed'], cluster_id: 'c1',
    sentiment: 'neutral', is_read: false, is_bookmarked: false,
    created_at: '2026-03-08T07:15:00Z', updated_at: '2026-03-08T07:15:00Z',
  },
  {
    id: 'a4', user_id: 'u1', source_id: 's4', source_name: 'TechCrunch',
    title: 'OpenAI Launches GPT-5.2 with Multimodal Reasoning Breakthrough',
    author: 'Kyle Wiggers', published_at: '2026-03-07T16:00:00Z', url: 'https://techcrunch.com/article/4',
    full_text: `OpenAI announced GPT-5.2 today, the latest iteration of its flagship large language model, featuring what the company describes as a breakthrough in multimodal reasoning capabilities.\n\nThe new model can simultaneously process and reason across text, images, audio, and video inputs, performing complex analytical tasks that previously required multiple specialized models.\n\nIn benchmark tests, GPT-5.2 scored 92% on the new MMLU-Pro evaluation, up from 84% for GPT-5. More notably, it achieved near-human performance on a new suite of scientific reasoning tasks developed in collaboration with researchers at MIT and Stanford.\n\nSam Altman, CEO of OpenAI, said the release represents "the beginning of truly general artificial intelligence" and that the model would be available to enterprise customers immediately, with consumer access rolling out over the next month.\n\nThe announcement sent shares of AI-related companies higher, with NVIDIA gaining 3.2% and Microsoft, OpenAI's primary investor, rising 2.1%.`,
    image_url: null, topic_tags: ['technology', 'ai'], cluster_id: 'c2',
    sentiment: 'positive', is_read: false, is_bookmarked: false,
    created_at: '2026-03-07T16:00:00Z', updated_at: '2026-03-07T16:00:00Z',
  },
  {
    id: 'a5', user_id: 'u1', source_id: 's2', source_name: 'Financial Times',
    title: 'AI Arms Race Intensifies as OpenAI, Google and Anthropic Release New Models',
    author: 'Madhumita Murgia', published_at: '2026-03-07T18:00:00Z', url: 'https://ft.com/article/5',
    full_text: `The race to build the most capable artificial intelligence models has entered a new phase, with OpenAI, Google, and Anthropic all releasing major model updates within the span of a single week.\n\nOpenAI's GPT-5.2, Google's Gemini 3 Pro, and Anthropic's Claude 4 each claim significant advances in reasoning, multimodal capabilities, and safety. The rapid pace of releases has surprised even industry insiders.\n\n"We're seeing capability gains that most researchers didn't expect until 2027 or 2028," said Dario Amodei, CEO of Anthropic. "The question is no longer whether AI can perform complex reasoning, but how to deploy it responsibly."\n\nThe competitive dynamics have also shifted the business landscape. Enterprise spending on AI services is projected to reach $340 billion in 2026, according to IDC, with the three leading labs capturing more than 60% of the market.\n\nEuropean regulators have expressed concern about the pace of development, with the EU's AI Office announcing an expedited review of whether the new models comply with the AI Act's risk assessment requirements.`,
    image_url: null, topic_tags: ['technology', 'ai', 'business'], cluster_id: 'c2',
    sentiment: 'mixed', is_read: false, is_bookmarked: false,
    created_at: '2026-03-07T18:00:00Z', updated_at: '2026-03-07T18:00:00Z',
  },
  {
    id: 'a6', user_id: 'u1', source_id: 's5', source_name: 'The Economist',
    title: "China's Economic Slowdown Deepens as Property Crisis Spreads",
    author: null, published_at: '2026-03-07T14:00:00Z', url: 'https://economist.com/article/6',
    full_text: `China's economic troubles are multiplying. The property sector, which accounts for roughly a quarter of GDP when related industries are included, is showing no signs of stabilisation despite repeated government interventions.\n\nNew data released this week paint a grim picture. Property sales fell 18% year-on-year in February, while new construction starts dropped 24%. Perhaps most alarming, local government land sales revenue—a crucial source of fiscal funding—declined for the 20th consecutive month.\n\nThe ripple effects are now spreading beyond property. Consumer confidence has fallen to its lowest level since the pandemic, retail sales growth has slowed to just 2.1%, and youth unemployment remains stubbornly high at 17.3%.\n\nBeijing's response has been piecemeal. The People's Bank of China cut its benchmark lending rate by 10 basis points last month, and several cities have relaxed home-purchase restrictions. But economists argue that more radical measures—such as direct fiscal transfers to households—are needed to break the deflationary spiral.\n\n"China is caught between the need for structural reform and the political imperative to maintain growth," says Michael Pettis, a professor at Peking University. "The longer they delay meaningful action, the deeper the adjustment will be."`,
    image_url: null, topic_tags: ['macro', 'geopolitics', 'china'], cluster_id: 'c3',
    sentiment: 'negative', is_read: false, is_bookmarked: false,
    created_at: '2026-03-07T14:00:00Z', updated_at: '2026-03-07T14:00:00Z',
  },
  {
    id: 'a7', user_id: 'u1', source_id: 's1', source_name: 'Bloomberg',
    title: 'China Stimulus Package Falls Short as Deflation Risks Mount',
    author: 'Tom Hancock', published_at: '2026-03-07T12:00:00Z', url: 'https://bloomberg.com/article/7',
    full_text: `China's latest economic stimulus measures are failing to gain traction, with markets and economists increasingly skeptical that the government's incremental approach can reverse a deepening slowdown.\n\nThe State Council announced a new package of measures last week, including tax breaks for small businesses, expanded infrastructure spending, and measures to support the property market. But the total fiscal impulse amounts to roughly 1.5% of GDP—well below the 4-5% that analysts at Nomura and Morgan Stanley say is needed.\n\nChinese equities fell for the third consecutive week, with the CSI 300 index down 2.1%. The yuan weakened to 7.28 against the dollar, its lowest level in three months.\n\nThe deflation risk is now front and center. China's consumer price index fell 0.3% year-on-year in February, marking the fifth consecutive month of deflation. Producer prices fell even more sharply, declining 2.7%.\n\n"The parallels with Japan's lost decade are becoming harder to dismiss," said Robin Brooks, chief economist at the Institute of International Finance.`,
    image_url: null, topic_tags: ['macro', 'geopolitics', 'china', 'markets'], cluster_id: 'c3',
    sentiment: 'negative', is_read: true, is_bookmarked: false,
    created_at: '2026-03-07T12:00:00Z', updated_at: '2026-03-07T12:00:00Z',
  },
  {
    id: 'a8', user_id: 'u1', source_id: 's3', source_name: 'Reuters',
    title: 'EU Approves Landmark Digital Markets Regulation Package',
    author: 'Foo Yun Chee', published_at: '2026-03-08T10:00:00Z', url: 'https://reuters.com/article/8',
    full_text: `BRUSSELS (Reuters) - The European Union approved a sweeping new package of digital market regulations on Friday, significantly expanding the scope of the Digital Markets Act and imposing new obligations on large technology platforms.\n\nThe regulations, which will take effect in 2027, require platforms with more than 50 million monthly active users in the EU to provide full data portability, interoperability with rival services, and algorithmic transparency.\n\nThe package also introduces new rules on AI-generated content, requiring platforms to label synthetic media and provide users with tools to control algorithmic recommendations.\n\nTech industry groups criticized the regulations as overly burdensome. "These rules will stifle innovation and put European companies at a competitive disadvantage," said Christian Borggreen, vice president of the Computer & Communications Industry Association.\n\nHowever, European Commissioner for Competition Margrethe Vestager defended the package, saying it was necessary to ensure "a level playing field in digital markets."`,
    image_url: null, topic_tags: ['technology', 'geopolitics', 'regulation'], cluster_id: 'c4',
    sentiment: 'neutral', is_read: false, is_bookmarked: false,
    created_at: '2026-03-08T10:00:00Z', updated_at: '2026-03-08T10:00:00Z',
  },
];

export const mockClusters: TopicCluster[] = [
  {
    id: 'c1', user_id: 'u1', title: 'Federal Reserve Rate Cut Signal',
    overview: 'The Federal Reserve has signaled a potential shift toward rate cuts in Q2 2026, citing slowing economic growth and a cooling labor market. Markets rallied on the news, with equities rising and Treasury yields falling sharply.',
    article_count: 3, sources: ['Bloomberg', 'Financial Times', 'Reuters'],
    top_tags: ['macro', 'markets', 'fed'], latest_update: '2026-03-08T09:00:00Z',
    created_at: '2026-03-08T07:15:00Z',
  },
  {
    id: 'c2', user_id: 'u1', title: 'AI Model Arms Race Escalation',
    overview: 'OpenAI, Google, and Anthropic have all released major AI model updates within a single week, marking an acceleration in the competitive landscape. The releases raise questions about deployment safety and regulatory compliance.',
    article_count: 2, sources: ['TechCrunch', 'Financial Times'],
    top_tags: ['technology', 'ai', 'business'], latest_update: '2026-03-07T18:00:00Z',
    created_at: '2026-03-07T16:00:00Z',
  },
  {
    id: 'c3', user_id: 'u1', title: 'China Economic Slowdown & Deflation',
    overview: 'China\'s economic challenges are deepening as the property crisis spreads to consumer spending and local government finances. Stimulus measures have so far fallen short of what economists believe is needed.',
    article_count: 2, sources: ['The Economist', 'Bloomberg'],
    top_tags: ['macro', 'geopolitics', 'china'], latest_update: '2026-03-07T14:00:00Z',
    created_at: '2026-03-07T12:00:00Z',
  },
  {
    id: 'c4', user_id: 'u1', title: 'EU Digital Markets Regulation',
    overview: 'The European Union has approved a landmark expansion of its digital markets regulation, imposing new obligations on large tech platforms around data portability, interoperability, and AI content labeling.',
    article_count: 1, sources: ['Reuters'],
    top_tags: ['technology', 'geopolitics', 'regulation'], latest_update: '2026-03-08T10:00:00Z',
    created_at: '2026-03-08T10:00:00Z',
  },
];

export const mockBriefing: DailyBriefing = {
  id: 'b1', user_id: 'u1', date: '2026-03-08',
  sections: [
    {
      category: 'Markets',
      items: [
        { title: 'Fed Signals Rate Cut Pivot', summary: 'The Federal Reserve delivered its strongest signal yet that rate cuts could begin in Q2 2026. S&P 500 rallied 1.2%, Treasury yields fell sharply. Economists now expect 75bps of cuts by year-end.', cluster_id: 'c1', sources: ['Bloomberg', 'Financial Times', 'Reuters'] },
      ],
    },
    {
      category: 'Macro',
      items: [
        { title: 'China Deflation Deepens', summary: 'China\'s CPI fell for the fifth consecutive month as the property crisis spreads. Stimulus measures totaling 1.5% of GDP are seen as insufficient. Parallels to Japan\'s lost decade are mounting.', cluster_id: 'c3', sources: ['The Economist', 'Bloomberg'] },
      ],
    },
    {
      category: 'Technology',
      items: [
        { title: 'AI Model Race Accelerates', summary: 'OpenAI launched GPT-5.2, Google released Gemini 3 Pro, and Anthropic shipped Claude 4—all within one week. Enterprise AI spending projected to reach $340B in 2026.', cluster_id: 'c2', sources: ['TechCrunch', 'Financial Times'] },
        { title: 'EU Expands Digital Regulation', summary: 'New EU regulations require large platforms to provide data portability, algorithmic transparency, and AI content labeling. Takes effect 2027.', cluster_id: 'c4', sources: ['Reuters'] },
      ],
    },
    {
      category: 'Geopolitics',
      items: [
        { title: 'China-West Tensions Simmer', summary: 'Beijing\'s economic weakness adds a new dimension to geopolitical dynamics, with implications for trade negotiations and currency markets.', sources: ['The Economist'] },
      ],
    },
  ],
  created_at: '2026-03-08T06:00:00Z',
};

export const mockSummary: ArticleSummary = {
  id: 'sum1', article_id: 'a1',
  summary: 'The Federal Reserve signaled potential rate cuts beginning Q2 2026, citing slowing growth and a cooling labor market. Markets responded positively with equities rising and yields falling.',
  key_takeaways: [
    'Fed removed hawkish language about further tightening',
    'Dot plot shows majority expecting 2+ cuts by year-end',
    'Unemployment ticked up to 4.1%',
    'Inflation still above target at 2.8%',
    'Goldman and JPMorgan expect first cut in June',
  ],
  why_it_matters: 'A Fed pivot would mark the end of the most aggressive tightening cycle in decades, with significant implications for equity valuations, bond markets, mortgage rates, and emerging market economies.',
  implications: 'Bull case: Lower rates support equity multiples, housing recovery, and EM debt relief. Bear case: Cutting too early could reignite inflation or signal the Fed sees deeper economic weakness than currently priced.',
  created_at: '2026-03-08T09:00:00Z',
};

export const mockComparison: TopicComparison = {
  id: 'comp1', cluster_id: 'c1',
  agreements: [
    'All sources agree the Fed kept rates steady but shifted language toward potential cuts',
    'Markets rallied with S&P 500 up ~1.2%',
    'Treasury yields fell sharply across the curve',
    'Economists broadly expect first cut in Q2 2026',
  ],
  differences: [
    'Bloomberg emphasizes the economic data (unemployment, manufacturing) driving the shift',
    'FT focuses on market reaction and divisions within the FOMC',
    'Reuters provides the most neutral, wire-service style coverage with emphasis on the statement language',
    'FT uniquely reports on FOMC member dissent, citing internal divisions',
    'Bloomberg quotes Bank of America strategist; FT quotes JPMorgan Asset Management',
  ],
  tone_analysis: 'Bloomberg takes an analytical, data-driven tone. The FT adopts a more market-focused narrative with emphasis on the political dynamics within the Fed. Reuters maintains its characteristic neutral, factual wire-service style.',
  missing_angles: [
    'None of the sources discuss potential impact on cryptocurrency markets',
    'Limited coverage of how rate cuts might affect the US fiscal deficit',
    'No source addresses the housing market implications in detail',
  ],
  created_at: '2026-03-08T10:00:00Z',
};

export const mockChatMessages: ChatMessage[] = [
  { id: 'msg1', session_id: 'cs1', role: 'user', content: 'What are the key differences in how Bloomberg and FT cover the Fed rate decision?', sources_cited: [], created_at: '2026-03-08T10:30:00Z' },
  { id: 'msg2', session_id: 'cs1', role: 'assistant', content: 'Based on the available articles, there are several notable differences:\n\n**Bloomberg** takes a data-driven approach, leading with the economic indicators (unemployment at 4.1%, manufacturing decline) and quoting Bank of America\'s Mark Cabana on the Fed pivot signal.\n\n**Financial Times** focuses more on market dynamics and internal Fed politics. The FT uniquely reports on divisions within the FOMC, noting that "several regional Fed presidents" expressed concern about cutting too soon. They also emphasize the global implications, particularly for emerging markets.\n\nBoth agree on the core facts—rates held steady, language shifted, markets rallied—but their framing reflects their editorial perspectives: Bloomberg as a market data provider, FT as a global business narrative outlet.', sources_cited: ['a1', 'a2'], created_at: '2026-03-08T10:31:00Z' },
  { id: 'msg3', session_id: 'cs1', role: 'user', content: 'What does this mean for markets in the next quarter?', sources_cited: [], created_at: '2026-03-08T10:32:00Z' },
  { id: 'msg4', session_id: 'cs1', role: 'assistant', content: 'Based on the articles in your feed, here\'s what the coverage suggests for Q2 2026:\n\n**Positive signals:**\n- Goldman Sachs and JPMorgan both project a 25bp cut at the June meeting (Bloomberg)\n- Markets have already begun pricing in rate relief, with equities up and yields down\n- Emerging market debt could see significant relief from a weaker dollar\n\n**Risks to watch:**\n- Inflation remains at 2.8%, above the 2% target—cutting too early could reignite price pressures\n- FOMC divisions suggest the path to cuts may not be smooth (FT)\n- China\'s economic weakness could create external headwinds regardless of Fed action\n\n**Key levels:**\n- The 2-year Treasury yield at 4.35% is pricing in cuts; any hawkish surprise could reverse this\n- S&P 500 rally could extend if data confirms the soft-landing narrative\n\n⚠️ Note: This analysis is based on the articles in your feed and may not capture all relevant factors.', sources_cited: ['a1', 'a2', 'a3'], created_at: '2026-03-08T10:33:00Z' },
];

export const mockChatSessions: ChatSession[] = [
  { id: 'cs1', user_id: 'u1', title: 'Fed Rate Decision Analysis', context_type: 'topic', context_id: 'c1', created_at: '2026-03-08T10:30:00Z', updated_at: '2026-03-08T10:33:00Z' },
  { id: 'cs2', user_id: 'u1', title: 'AI Market Impact', context_type: 'general', context_id: null, created_at: '2026-03-07T15:00:00Z', updated_at: '2026-03-07T15:15:00Z' },
];

export const sourceTypeLabels: Record<string, string> = {
  rss: 'RSS Feed',
  api: 'API',
  manual: 'Manual Import',
  browser: 'Browser Capture',
  file: 'File Upload',
};

export const categoryColors: Record<string, string> = {
  Markets: 'bg-chart-up/10 text-chart-up',
  Macro: 'bg-primary/10 text-primary',
  Technology: 'bg-info/10 text-info',
  Geopolitics: 'bg-warning/10 text-warning',
  Business: 'bg-accent/10 text-accent',
  Other: 'bg-muted text-muted-foreground',
};
