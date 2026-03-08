// Discovery and sync types for premium source connectors

export interface SourceDiscoveryEndpoint {
  id: string;
  source_id: string;
  user_id: string;
  label: string;
  endpoint_url: string;
  is_active: boolean;
  last_checked_at: string | null;
  created_at: string;
}

export interface DiscoveredUrl {
  id: string;
  source_id: string;
  user_id: string;
  url: string;
  title: string | null;
  discovered_at: string;
  ingested: boolean;
  article_id: string | null;
}

export interface ConnectorSyncRun {
  id: string;
  source_id: string;
  user_id: string;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at: string | null;
  urls_discovered: number;
  urls_new: number;
  articles_imported: number;
  errors: string[];
  created_at: string;
}

export type SyncFrequency = '30m' | '1h' | '3h' | '6h' | '12h' | '24h' | 'manual';

export const syncFrequencyLabels: Record<SyncFrequency, string> = {
  '30m': 'Every 30 minutes',
  '1h': 'Every hour',
  '3h': 'Every 3 hours',
  '6h': 'Every 6 hours',
  '12h': 'Twice daily',
  '24h': 'Daily',
  'manual': 'Manual only',
};

// Premium source templates
export interface PremiumSourceTemplate {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  description: string;
  sections: { label: string; url: string }[];
  defaultSyncFrequency: SyncFrequency;
}

export const premiumSourceTemplates: PremiumSourceTemplate[] = [
  {
    id: 'economist',
    name: 'The Economist',
    domain: 'economist.com',
    description: 'Global news, politics, economics, business and finance',
    sections: [
      { label: 'Homepage', url: 'https://www.economist.com/' },
      { label: 'World', url: 'https://www.economist.com/world' },
      { label: 'Business', url: 'https://www.economist.com/business' },
      { label: 'Finance & Economics', url: 'https://www.economist.com/finance-and-economics' },
      { label: 'Science & Technology', url: 'https://www.economist.com/science-and-technology' },
      { label: 'Leaders (Opinion)', url: 'https://www.economist.com/leaders' },
      { label: 'Briefing', url: 'https://www.economist.com/briefing' },
    ],
    defaultSyncFrequency: '6h',
  },
  {
    id: 'ft',
    name: 'Financial Times',
    domain: 'ft.com',
    description: 'Financial news, analysis, and market data',
    sections: [
      { label: 'Homepage', url: 'https://www.ft.com/' },
      { label: 'World', url: 'https://www.ft.com/world' },
      { label: 'Markets', url: 'https://www.ft.com/markets' },
      { label: 'Companies', url: 'https://www.ft.com/companies' },
      { label: 'Opinion', url: 'https://www.ft.com/opinion' },
    ],
    defaultSyncFrequency: '1h',
  },
  {
    id: 'bloomberg',
    name: 'Bloomberg',
    domain: 'bloomberg.com',
    description: 'Business, financial information, and news',
    sections: [
      { label: 'Homepage', url: 'https://www.bloomberg.com/' },
      { label: 'Markets', url: 'https://www.bloomberg.com/markets' },
      { label: 'Economics', url: 'https://www.bloomberg.com/economics' },
      { label: 'Technology', url: 'https://www.bloomberg.com/technology' },
      { label: 'Politics', url: 'https://www.bloomberg.com/politics' },
    ],
    defaultSyncFrequency: '1h',
  },
  {
    id: 'foreign-affairs',
    name: 'Foreign Affairs',
    domain: 'foreignaffairs.com',
    description: 'International relations and US foreign policy',
    sections: [
      { label: 'Homepage', url: 'https://www.foreignaffairs.com/' },
      { label: 'Latest', url: 'https://www.foreignaffairs.com/latest' },
    ],
    defaultSyncFrequency: '24h',
  },
];

export type ConnectorHealth = 'healthy' | 'degraded' | 'disconnected' | 'pending';

export const connectorHealthLabels: Record<ConnectorHealth, string> = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  disconnected: 'Disconnected',
  pending: 'Awaiting Connection',
};
