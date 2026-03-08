import type { Source, Article, ArticleSummary, ClusterComparison, DailyBriefing, ChatMessage, ChatSession, EventCluster } from '@/types';

export const mockSources: Source[] = [
  { id: 's1', user_id: 'u1', source_name: 'Bloomberg', source_domain: 'bloomberg.com', source_type: 'api_connector', is_active: true, sync_frequency: '1h', last_sync_at: '2026-03-08T06:00:00Z', last_successful_sync_at: '2026-03-08T06:00:00Z', status: 'connected', notes: null, auth_method: 'browser_session', connector_settings: {}, article_count: 12, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-03-08T06:00:00Z' },
  { id: 's2', user_id: 'u1', source_name: 'Financial Times', source_domain: 'ft.com', source_type: 'rss_connector', is_active: true, sync_frequency: '1h', last_sync_at: '2026-03-08T05:30:00Z', last_successful_sync_at: '2026-03-08T05:30:00Z', status: 'connected', notes: null, auth_method: 'rss', connector_settings: { feed_url: 'https://ft.com/rss' }, article_count: 18, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-03-08T05:30:00Z' },
  { id: 's3', user_id: 'u1', source_name: 'Reuters', source_domain: 'reuters.com', source_type: 'rss_connector', is_active: true, sync_frequency: '30m', last_sync_at: '2026-03-08T05:45:00Z', last_successful_sync_at: '2026-03-08T05:45:00Z', status: 'connected', notes: null, auth_method: 'rss', connector_settings: { feed_url: 'https://reuters.com/rss' }, article_count: 24, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-03-08T05:45:00Z' },
  { id: 's4', user_id: 'u1', source_name: 'TechCrunch', source_domain: 'techcrunch.com', source_type: 'rss_connector', is_active: true, sync_frequency: '2h', last_sync_at: '2026-03-08T04:00:00Z', last_successful_sync_at: '2026-03-08T04:00:00Z', status: 'connected', notes: null, auth_method: 'rss', connector_settings: { feed_url: 'https://techcrunch.com/feed/' }, article_count: 8, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-03-08T04:00:00Z' },
  { id: 's5', user_id: 'u1', source_name: 'The Economist', source_domain: 'economist.com', source_type: 'browser_session_connector', is_active: true, sync_frequency: '6h', last_sync_at: '2026-03-07T22:00:00Z', last_successful_sync_at: '2026-03-07T22:00:00Z', status: 'connected', notes: 'Premium content via browser session', auth_method: 'browser_session', connector_settings: {}, article_count: 6, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-03-07T22:00:00Z' },
  { id: 's6', user_id: 'u1', source_name: 'WSJ', source_domain: 'wsj.com', source_type: 'browser_session_connector', is_active: false, sync_frequency: '2h', last_sync_at: '2026-03-06T12:00:00Z', last_successful_sync_at: null, status: 'needs_attention', notes: 'Browser session expired', auth_method: 'browser_session', connector_settings: {}, article_count: 0, created_at: '2026-02-01T00:00:00Z', updated_at: '2026-03-06T12:00:00Z' },
];

export const mockArticles: Article[] = [
  {
    id: 'a1', user_id: 'u1', source_id: 's1', source_name: 'Bloomberg',
    title: 'Federal Reserve Signals Potential Rate Cut in Q2 Amid Slowing Growth',
    subtitle: null, author: 'Jennifer Hughes', published_at: '2026-03-08T08:30:00Z',
    canonical_url: 'https://bloomberg.com/article/1',
    body_text: `The Federal Reserve signaled on Friday that it may begin cutting interest rates as early as Q2 2026, as recent economic data points to a significant slowdown in growth across multiple sectors.\n\nFed Chair Jerome Powell, speaking at a press conference following the latest FOMC meeting, noted that "the balance of risks has shifted" and that the committee is "closely monitoring incoming data for signs that a policy adjustment may be warranted."\n\nThe statement marks a notable shift from the Fed's previously hawkish stance, which had kept rates elevated for over two years. Markets responded positively, with the S&P 500 rising 1.2% and Treasury yields falling sharply across the curve.\n\nEconomists at Goldman Sachs and JPMorgan have both revised their rate forecasts, now expecting a 25 basis point cut at the June meeting, with a further 50 basis points of cuts by year-end.\n\n"This is the clearest signal yet that the Fed is preparing to pivot," said Mark Cabana, head of US rates strategy at Bank of America. "The question now is whether the economy slows fast enough to justify a more aggressive cutting cycle."\n\nKey data points cited by Powell include softening consumer spending, a cooling labor market with unemployment ticking up to 4.1%, and declining manufacturing activity. However, he cautioned that inflation, while moderating, remains above the 2% target at 2.8%.`,
    hero_image_url: null, section: 'Markets', topic_tags: ['macro', 'markets', 'fed'],
    content_hash: 'abc1', language: 'en', status: 'enriched', confidence_score: 0.95,
    sentiment: 'neutral', is_read: false, is_bookmarked: false,
    imported_at: '2026-03-08T08:30:00Z', created_at: '2026-03-08T08:30:00Z', updated_at: '2026-03-08T08:30:00Z',
  },
  {
    id: 'a2', user_id: 'u1', source_id: 's2', source_name: 'Financial Times',
    title: 'Fed Pivot: Markets Rally as Powell Hints at Rate Cuts',
    subtitle: null, author: 'Colby Smith', published_at: '2026-03-08T09:00:00Z',
    canonical_url: 'https://ft.com/article/2',
    body_text: `Financial markets surged on Friday after Federal Reserve chair Jay Powell delivered his strongest signal yet that rate cuts are on the horizon.\n\nIn a shift that caught some analysts off guard, Powell acknowledged that the US economy is entering "a new phase" characterised by slower growth and a gradually cooling labour market.\n\nThe dollar fell against major currencies, while gold rallied to a new high above $2,850 per ounce. European markets also responded positively, with the FTSE 100 and Euro Stoxx 50 both rising more than 0.8%.\n\nHowever, the FT understands that divisions remain within the FOMC, with several regional Fed presidents expressing concern that cutting rates too soon could reignite inflation.`,
    hero_image_url: null, section: 'Markets', topic_tags: ['macro', 'markets', 'fed'],
    content_hash: 'abc2', language: 'en', status: 'enriched', confidence_score: 0.92,
    sentiment: 'positive', is_read: true, is_bookmarked: true,
    imported_at: '2026-03-08T09:00:00Z', created_at: '2026-03-08T09:00:00Z', updated_at: '2026-03-08T09:00:00Z',
  },
  {
    id: 'a3', user_id: 'u1', source_id: 's3', source_name: 'Reuters',
    title: 'Fed Holds Rates Steady But Opens Door to Cuts',
    subtitle: null, author: 'Howard Schneider', published_at: '2026-03-08T07:15:00Z',
    canonical_url: 'https://reuters.com/article/3',
    body_text: `WASHINGTON (Reuters) - The Federal Reserve held its benchmark interest rate steady on Friday but signaled it could begin cutting rates in the coming months, citing a deteriorating economic outlook.\n\nThe central bank kept the federal funds rate in the 5.25%-5.50% range, as widely expected, but removed key language from its statement that had previously emphasized the need for "further tightening."`,
    hero_image_url: null, section: 'Economy', topic_tags: ['macro', 'markets', 'fed'],
    content_hash: 'abc3', language: 'en', status: 'enriched', confidence_score: 0.90,
    sentiment: 'neutral', is_read: false, is_bookmarked: false,
    imported_at: '2026-03-08T07:15:00Z', created_at: '2026-03-08T07:15:00Z', updated_at: '2026-03-08T07:15:00Z',
  },
  {
    id: 'a4', user_id: 'u1', source_id: 's4', source_name: 'TechCrunch',
    title: 'OpenAI Launches GPT-5.2 with Multimodal Reasoning Breakthrough',
    subtitle: null, author: 'Kyle Wiggers', published_at: '2026-03-07T16:00:00Z',
    canonical_url: 'https://techcrunch.com/article/4',
    body_text: `OpenAI announced GPT-5.2 today, the latest iteration of its flagship large language model, featuring what the company describes as a breakthrough in multimodal reasoning capabilities.\n\nThe new model can simultaneously process and reason across text, images, audio, and video inputs.`,
    hero_image_url: null, section: 'AI', topic_tags: ['technology', 'ai'],
    content_hash: 'abc4', language: 'en', status: 'enriched', confidence_score: 0.88,
    sentiment: 'positive', is_read: false, is_bookmarked: false,
    imported_at: '2026-03-07T16:00:00Z', created_at: '2026-03-07T16:00:00Z', updated_at: '2026-03-07T16:00:00Z',
  },
  {
    id: 'a5', user_id: 'u1', source_id: 's2', source_name: 'Financial Times',
    title: 'AI Arms Race Intensifies as OpenAI, Google and Anthropic Release New Models',
    subtitle: null, author: 'Madhumita Murgia', published_at: '2026-03-07T18:00:00Z',
    canonical_url: 'https://ft.com/article/5',
    body_text: `The race to build the most capable artificial intelligence models has entered a new phase, with OpenAI, Google, and Anthropic all releasing major model updates within the span of a single week.`,
    hero_image_url: null, section: 'Technology', topic_tags: ['technology', 'ai', 'business'],
    content_hash: 'abc5', language: 'en', status: 'enriched', confidence_score: 0.85,
    sentiment: 'mixed', is_read: false, is_bookmarked: false,
    imported_at: '2026-03-07T18:00:00Z', created_at: '2026-03-07T18:00:00Z', updated_at: '2026-03-07T18:00:00Z',
  },
  {
    id: 'a6', user_id: 'u1', source_id: 's5', source_name: 'The Economist',
    title: "China's Economic Slowdown Deepens as Property Crisis Spreads",
    subtitle: null, author: null, published_at: '2026-03-07T14:00:00Z',
    canonical_url: 'https://economist.com/article/6',
    body_text: `China's economic troubles are multiplying. The property sector, which accounts for roughly a quarter of GDP when related industries are included, is showing no signs of stabilisation despite repeated government interventions.`,
    hero_image_url: null, section: 'Asia', topic_tags: ['macro', 'geopolitics', 'china'],
    content_hash: 'abc6', language: 'en', status: 'enriched', confidence_score: 0.90,
    sentiment: 'negative', is_read: false, is_bookmarked: false,
    imported_at: '2026-03-07T14:00:00Z', created_at: '2026-03-07T14:00:00Z', updated_at: '2026-03-07T14:00:00Z',
  },
  {
    id: 'a7', user_id: 'u1', source_id: 's1', source_name: 'Bloomberg',
    title: 'China Stimulus Package Falls Short as Deflation Risks Mount',
    subtitle: null, author: 'Tom Hancock', published_at: '2026-03-07T12:00:00Z',
    canonical_url: 'https://bloomberg.com/article/7',
    body_text: `China's latest economic stimulus measures are failing to gain traction, with markets and economists increasingly skeptical that the government's incremental approach can reverse a deepening slowdown.`,
    hero_image_url: null, section: 'Markets', topic_tags: ['macro', 'geopolitics', 'china', 'markets'],
    content_hash: 'abc7', language: 'en', status: 'enriched', confidence_score: 0.88,
    sentiment: 'negative', is_read: true, is_bookmarked: false,
    imported_at: '2026-03-07T12:00:00Z', created_at: '2026-03-07T12:00:00Z', updated_at: '2026-03-07T12:00:00Z',
  },
  {
    id: 'a8', user_id: 'u1', source_id: 's3', source_name: 'Reuters',
    title: 'EU Approves Landmark Digital Markets Regulation Package',
    subtitle: null, author: 'Foo Yun Chee', published_at: '2026-03-08T10:00:00Z',
    canonical_url: 'https://reuters.com/article/8',
    body_text: `BRUSSELS (Reuters) - The European Union approved a sweeping new package of digital market regulations on Friday, significantly expanding the scope of the Digital Markets Act.`,
    hero_image_url: null, section: 'Technology', topic_tags: ['technology', 'geopolitics', 'regulation'],
    content_hash: 'abc8', language: 'en', status: 'enriched', confidence_score: 0.85,
    sentiment: 'neutral', is_read: false, is_bookmarked: false,
    imported_at: '2026-03-08T10:00:00Z', created_at: '2026-03-08T10:00:00Z', updated_at: '2026-03-08T10:00:00Z',
  },
];

// Mock cluster IDs for article-cluster mapping
export const mockClusterArticleMap: Record<string, string[]> = {
  'c1': ['a1', 'a2', 'a3'],
  'c2': ['a4', 'a5'],
  'c3': ['a6', 'a7'],
  'c4': ['a8'],
};

export const mockClusters: EventCluster[] = [
  {
    id: 'c1', user_id: 'u1', title: 'Federal Reserve Rate Cut Signal',
    short_title: 'Fed Rate Signal',
    overview: 'The Federal Reserve has signaled a potential shift toward rate cuts in Q2 2026, citing slowing economic growth and a cooling labor market.',
    why_it_matters: 'A Fed pivot would mark the end of the most aggressive tightening cycle in decades.',
    first_seen_at: '2026-03-08T07:15:00Z', last_updated_at: '2026-03-08T09:00:00Z',
    status: 'active', top_entities: ['Federal Reserve', 'Jerome Powell', 'Goldman Sachs', 'JPMorgan'],
    top_keywords: ['rate cut', 'FOMC', 'inflation', 'treasury yields'],
    source_count: 3, article_count: 3, relevance_score: 95, recency_score: 98,
    created_at: '2026-03-08T07:15:00Z',
  },
  {
    id: 'c2', user_id: 'u1', title: 'AI Model Arms Race Escalation',
    short_title: 'AI Arms Race',
    overview: 'OpenAI, Google, and Anthropic have all released major AI model updates within a single week.',
    why_it_matters: 'Enterprise AI spending projected to reach $340B in 2026, reshaping competitive dynamics.',
    first_seen_at: '2026-03-07T16:00:00Z', last_updated_at: '2026-03-07T18:00:00Z',
    status: 'active', top_entities: ['OpenAI', 'Google', 'Anthropic', 'Sam Altman'],
    top_keywords: ['GPT-5.2', 'Gemini 3', 'Claude 4', 'multimodal'],
    source_count: 2, article_count: 2, relevance_score: 88, recency_score: 85,
    created_at: '2026-03-07T16:00:00Z',
  },
  {
    id: 'c3', user_id: 'u1', title: 'China Economic Slowdown & Deflation',
    short_title: 'China Slowdown',
    overview: 'China\'s economic challenges are deepening as the property crisis spreads to consumer spending.',
    why_it_matters: 'Parallels with Japan\'s lost decade are becoming harder to dismiss.',
    first_seen_at: '2026-03-07T12:00:00Z', last_updated_at: '2026-03-07T14:00:00Z',
    status: 'active', top_entities: ['China', 'PBOC', 'Beijing', 'CSI 300'],
    top_keywords: ['deflation', 'property crisis', 'stimulus', 'yuan'],
    source_count: 2, article_count: 2, relevance_score: 82, recency_score: 78,
    created_at: '2026-03-07T12:00:00Z',
  },
  {
    id: 'c4', user_id: 'u1', title: 'EU Digital Markets Regulation',
    short_title: 'EU Digital Regulation',
    overview: 'The EU approved a landmark expansion of its digital markets regulation.',
    why_it_matters: 'New rules could reshape how tech platforms operate in Europe.',
    first_seen_at: '2026-03-08T10:00:00Z', last_updated_at: '2026-03-08T10:00:00Z',
    status: 'developing', top_entities: ['EU', 'Margrethe Vestager', 'DMA'],
    top_keywords: ['digital markets act', 'AI regulation', 'data portability'],
    source_count: 1, article_count: 1, relevance_score: 72, recency_score: 90,
    created_at: '2026-03-08T10:00:00Z',
  },
];

export const mockBriefing: DailyBriefing = {
  id: 'b1', user_id: 'u1', date: '2026-03-08',
  content: {
    sections: [
      {
        theme: 'Markets',
        items: [
          { title: 'Fed Signals Rate Cut Pivot', summary: 'The Federal Reserve delivered its strongest signal yet that rate cuts could begin in Q2 2026. S&P 500 rallied 1.2%, Treasury yields fell sharply.', why_it_matters: 'A pivot would mark the end of the most aggressive tightening cycle in decades.', sources: ['Bloomberg', 'Financial Times', 'Reuters'], cluster_id: 'c1' },
        ],
      },
      {
        theme: 'Macro',
        items: [
          { title: 'China Deflation Deepens', summary: 'China\'s CPI fell for the fifth consecutive month as the property crisis spreads. Stimulus measures totaling 1.5% of GDP are seen as insufficient.', why_it_matters: 'Parallels to Japan\'s lost decade are mounting.', sources: ['The Economist', 'Bloomberg'], cluster_id: 'c3' },
        ],
      },
      {
        theme: 'Technology',
        items: [
          { title: 'AI Model Race Accelerates', summary: 'OpenAI launched GPT-5.2, Google released Gemini 3 Pro, and Anthropic shipped Claude 4—all within one week.', why_it_matters: 'Enterprise AI spending projected to reach $340B in 2026.', sources: ['TechCrunch', 'Financial Times'], cluster_id: 'c2' },
          { title: 'EU Expands Digital Regulation', summary: 'New EU regulations require large platforms to provide data portability, algorithmic transparency, and AI content labeling.', why_it_matters: 'Takes effect 2027, could reshape tech operations in Europe.', sources: ['Reuters'], cluster_id: 'c4' },
        ],
      },
      {
        theme: 'Geopolitics',
        items: [
          { title: 'China-West Tensions Simmer', summary: 'Beijing\'s economic weakness adds a new dimension to geopolitical dynamics, with implications for trade negotiations and currency markets.', why_it_matters: 'Economic weakness could temper or accelerate geopolitical tensions.', sources: ['The Economist'] },
        ],
      },
    ],
  },
  generated_at: '2026-03-08T06:00:00Z',
  created_at: '2026-03-08T06:00:00Z',
};

export const mockSummary: ArticleSummary = {
  id: 'sum1', article_id: 'a1',
  summary: 'The Federal Reserve signaled potential rate cuts beginning Q2 2026, citing slowing growth and a cooling labor market.',
  key_takeaways: [
    'Fed removed hawkish language about further tightening',
    'Dot plot shows majority expecting 2+ cuts by year-end',
    'Unemployment ticked up to 4.1%',
    'Inflation still above target at 2.8%',
    'Goldman and JPMorgan expect first cut in June',
  ],
  why_it_matters: 'A Fed pivot would mark the end of the most aggressive tightening cycle in decades.',
  implications: 'Bull case: Lower rates support equity multiples. Bear case: Cutting too early could reignite inflation.',
  created_at: '2026-03-08T09:00:00Z',
};

export const mockComparison: ClusterComparison = {
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
    'Reuters provides the most neutral, wire-service style coverage',
  ],
  tone_analysis: 'Bloomberg takes an analytical, data-driven tone. The FT adopts a more market-focused narrative. Reuters maintains its neutral wire-service style.',
  missing_angles: [
    'None of the sources discuss potential impact on cryptocurrency markets',
    'Limited coverage of how rate cuts might affect the US fiscal deficit',
  ],
  timeline_differences: 'Bloomberg published first with data focus, FT followed with market reaction and FOMC politics, Reuters was most neutral.',
  emphasis_analysis: { 'Bloomberg': 'data-driven', 'Financial Times': 'market-narrative', 'Reuters': 'neutral-factual' },
  created_at: '2026-03-08T10:00:00Z',
};

export const mockChatMessages: ChatMessage[] = [
  { id: 'msg1', session_id: 'cs1', role: 'user', content: 'What are the key differences in how Bloomberg and FT cover the Fed rate decision?', sources_cited: [], created_at: '2026-03-08T10:30:00Z' },
  { id: 'msg2', session_id: 'cs1', role: 'assistant', content: 'Based on the available articles, there are several notable differences:\n\n**Bloomberg** takes a data-driven approach, leading with the economic indicators.\n\n**Financial Times** focuses more on market dynamics and internal Fed politics.\n\nBoth agree on the core facts—rates held steady, language shifted, markets rallied.', sources_cited: ['a1', 'a2'], created_at: '2026-03-08T10:31:00Z' },
];

export const mockChatSessions: ChatSession[] = [
  { id: 'cs1', user_id: 'u1', title: 'Fed Rate Decision Analysis', context_type: 'topic', context_id: 'c1', created_at: '2026-03-08T10:30:00Z', updated_at: '2026-03-08T10:33:00Z' },
  { id: 'cs2', user_id: 'u1', title: 'AI Market Impact', context_type: 'general', context_id: null, created_at: '2026-03-07T15:00:00Z', updated_at: '2026-03-07T15:15:00Z' },
];

export const categoryColors: Record<string, string> = {
  Markets: 'bg-chart-up/10 text-chart-up',
  Macro: 'bg-primary/10 text-primary',
  Technology: 'bg-info/10 text-info',
  Geopolitics: 'bg-warning/10 text-warning',
  Business: 'bg-accent/10 text-accent',
  Policy: 'bg-muted text-muted-foreground',
  Energy: 'bg-warning/10 text-warning',
  Other: 'bg-muted text-muted-foreground',
};
