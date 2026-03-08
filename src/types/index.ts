export interface Source {
  id: string;
  user_id: string;
  name: string;
  type: 'rss' | 'api' | 'manual' | 'browser' | 'file';
  base_url: string;
  topic_tags: string[];
  is_active: boolean;
  priority: number;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: string;
  user_id: string;
  source_id: string;
  source_name: string;
  title: string;
  author: string | null;
  published_at: string;
  url: string;
  full_text: string;
  image_url: string | null;
  topic_tags: string[];
  cluster_id: string | null;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  is_read: boolean;
  is_bookmarked: boolean;
  created_at: string;
  updated_at: string;
}

export interface TopicCluster {
  id: string;
  user_id: string;
  title: string;
  overview: string;
  article_count: number;
  sources: string[];
  top_tags: string[];
  latest_update: string;
  created_at: string;
}

export interface ArticleSummary {
  id: string;
  article_id: string;
  summary: string;
  key_takeaways: string[];
  why_it_matters: string;
  implications: string | null;
  created_at: string;
}

export interface TopicComparison {
  id: string;
  cluster_id: string;
  agreements: string[];
  differences: string[];
  tone_analysis: string;
  missing_angles: string[];
  created_at: string;
}

export interface DailyBriefing {
  id: string;
  user_id: string;
  date: string;
  sections: BriefingSection[];
  created_at: string;
}

export interface BriefingSection {
  category: string;
  items: BriefingItem[];
}

export interface BriefingItem {
  title: string;
  summary: string;
  cluster_id?: string;
  sources: string[];
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  context_type: 'general' | 'topic' | 'article';
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
  view_density: 'compact' | 'detailed';
  default_sort: 'date' | 'relevance' | 'source';
  summary_length: 'short' | 'medium' | 'long';
}

export interface Bookmark {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
}
