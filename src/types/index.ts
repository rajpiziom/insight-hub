// === Source Types ===
export type SourceType = 'rss_connector' | 'api_connector' | 'manual_url_import' | 'browser_session_connector' | 'local_desktop_agent' | 'web_extension_connector';
export type SourceStatus = 'connected' | 'needs_attention' | 'syncing' | 'error' | 'inactive';
export type SourceAuthMethod = 'none' | 'rss' | 'api_key' | 'oauth' | 'browser_session' | 'local_agent' | 'extension' | 'manual';
export type ArticleStatus = 'imported' | 'processed' | 'enriched' | 'error';
export type ArticleSentiment = 'positive' | 'negative' | 'neutral' | 'mixed';
export type ClusterStatus = 'active' | 'developing' | 'stale' | 'archived';
export type IngestionJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface Source {
  id: string;
  user_id: string;
  source_name: string;
  source_domain: string | null;
  source_type: SourceType;
  is_active: boolean;
  sync_frequency: string;
  last_sync_at: string | null;
  last_successful_sync_at: string | null;
  status: SourceStatus;
  notes: string | null;
  auth_method: SourceAuthMethod;
  connector_settings: Record<string, any>;
  article_count: number;
  auto_sync_enabled: boolean;
  discovery_scope: { label: string; url: string }[] | null;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: string;
  user_id: string;
  source_id: string | null;
  source_name: string;
  canonical_url: string;
  title: string;
  subtitle: string | null;
  author: string | null;
  published_at: string | null;
  body_text: string | null;
  section: string | null;
  topic_tags: string[];
  hero_image_url: string | null;
  content_hash: string | null;
  language: string;
  status: ArticleStatus;
  confidence_score: number;
  sentiment: ArticleSentiment;
  is_read: boolean;
  is_bookmarked: boolean;
  imported_at: string;
  created_at: string;
  updated_at: string;
}

export interface IngestionJob {
  id: string;
  user_id: string;
  source_id: string | null;
  status: IngestionJobStatus;
  started_at: string | null;
  completed_at: string | null;
  articles_found: number;
  articles_imported: number;
  articles_deduplicated: number;
  errors_count: number;
  warnings: string[];
  created_at: string;
  // joined
  source?: Source;
}

export interface EventCluster {
  id: string;
  user_id: string;
  title: string;
  short_title: string | null;
  overview: string | null;
  why_it_matters: string | null;
  first_seen_at: string;
  last_updated_at: string;
  status: ClusterStatus;
  top_entities: string[];
  top_keywords: string[];
  source_count: number;
  article_count: number;
  relevance_score: number;
  recency_score: number;
  created_at: string;
  // joined
  articles?: Article[];
  themes?: MacroTheme[];
}

export interface MacroTheme {
  id: string;
  name: string;
  display_name: string;
  color: string | null;
  icon: string | null;
  sort_order: number;
  created_at: string;
  // joined
  clusters?: EventCluster[];
}

export interface NamedEntity {
  id: string;
  user_id: string;
  name: string;
  entity_type: string;
  mention_count: number;
  last_seen_at: string;
  created_at: string;
}

export interface ArticleSummary {
  id: string;
  article_id: string;
  summary: string;
  key_takeaways: string[];
  why_it_matters: string | null;
  implications: string | null;
  created_at: string;
}

export interface ClusterComparison {
  id: string;
  cluster_id: string;
  agreements: string[];
  differences: string[];
  tone_analysis: string | null;
  missing_angles: string[];
  timeline_differences: string | null;
  emphasis_analysis: Record<string, any>;
  created_at: string;
}

export interface DailyBriefing {
  id: string;
  user_id: string;
  date: string;
  content: BriefingContent;
  generated_at: string;
  created_at: string;
}

export interface BriefingContent {
  sections: BriefingSection[];
}

export interface BriefingSection {
  theme: string;
  items: BriefingItem[];
}

export interface BriefingItem {
  title: string;
  summary: string;
  why_it_matters: string;
  sources: string[];
  cluster_id?: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  context_type: string;
  context_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  sources_cited: string[];
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  favorite_topics: string[];
  muted_topics: string[];
  preferred_sources: string[];
  briefing_categories: string[];
  view_density: string;
  default_sort: string;
  summary_length: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
}

// Source type display labels
export const sourceTypeLabels: Record<SourceType, string> = {
  rss_connector: 'RSS Feed',
  api_connector: 'API Connector',
  manual_url_import: 'Manual Import',
  browser_session_connector: 'Browser Session',
  local_desktop_agent: 'Desktop Agent',
  web_extension_connector: 'Browser Extension',
};

export const sourceStatusLabels: Record<SourceStatus, string> = {
  connected: 'Connected',
  needs_attention: 'Needs Attention',
  syncing: 'Syncing',
  error: 'Error',
  inactive: 'Inactive',
};

export const sourceAuthLabels: Record<SourceAuthMethod, string> = {
  none: 'None',
  rss: 'RSS Feed',
  api_key: 'API Key',
  oauth: 'OAuth',
  browser_session: 'Browser Session',
  local_agent: 'Local Agent',
  extension: 'Extension',
  manual: 'Manual',
};
