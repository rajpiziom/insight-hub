
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Source auth method enum
CREATE TYPE public.source_auth_method AS ENUM ('none', 'rss', 'api_key', 'oauth', 'browser_session', 'local_agent', 'extension', 'manual');
-- Source status enum
CREATE TYPE public.source_status AS ENUM ('connected', 'needs_attention', 'syncing', 'error', 'inactive');
-- Source type enum
CREATE TYPE public.source_type AS ENUM ('rss_connector', 'api_connector', 'manual_url_import', 'browser_session_connector', 'local_desktop_agent', 'web_extension_connector');

-- Sources table
CREATE TABLE public.sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  source_domain TEXT,
  source_type public.source_type NOT NULL DEFAULT 'rss_connector',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sync_frequency TEXT DEFAULT '1h',
  last_sync_at TIMESTAMPTZ,
  last_successful_sync_at TIMESTAMPTZ,
  status public.source_status NOT NULL DEFAULT 'connected',
  notes TEXT,
  auth_method public.source_auth_method NOT NULL DEFAULT 'none',
  connector_settings JSONB DEFAULT '{}',
  article_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sources" ON public.sources FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Article status enum
CREATE TYPE public.article_status AS ENUM ('imported', 'processed', 'enriched', 'error');
-- Sentiment enum
CREATE TYPE public.article_sentiment AS ENUM ('positive', 'negative', 'neutral', 'mixed');

-- Articles table
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id UUID REFERENCES public.sources(id) ON DELETE SET NULL,
  source_name TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  author TEXT,
  published_at TIMESTAMPTZ,
  body_text TEXT,
  section TEXT,
  topic_tags TEXT[] DEFAULT '{}',
  hero_image_url TEXT,
  content_hash TEXT,
  language TEXT DEFAULT 'en',
  status public.article_status NOT NULL DEFAULT 'imported',
  confidence_score NUMERIC(3,2) DEFAULT 0.80,
  sentiment public.article_sentiment DEFAULT 'neutral',
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_bookmarked BOOLEAN NOT NULL DEFAULT false,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_hash)
);
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own articles" ON public.articles FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_articles_user_published ON public.articles(user_id, published_at DESC);
CREATE INDEX idx_articles_content_hash ON public.articles(user_id, content_hash);
CREATE INDEX idx_articles_source ON public.articles(source_id);

-- Ingestion jobs
CREATE TYPE public.ingestion_job_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');

CREATE TABLE public.ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id UUID REFERENCES public.sources(id) ON DELETE SET NULL,
  status public.ingestion_job_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  articles_found INTEGER DEFAULT 0,
  articles_imported INTEGER DEFAULT 0,
  articles_deduplicated INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  warnings TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ingestion_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own jobs" ON public.ingestion_jobs FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.ingestion_job_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.ingestion_jobs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ingestion_job_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own job events" ON public.ingestion_job_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ingestion_jobs j WHERE j.id = job_id AND j.user_id = auth.uid()));

-- Macro themes
CREATE TABLE public.macro_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.macro_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read themes" ON public.macro_themes FOR SELECT TO authenticated USING (true);

-- Event clusters
CREATE TYPE public.cluster_status AS ENUM ('active', 'developing', 'stale', 'archived');

CREATE TABLE public.event_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  short_title TEXT,
  overview TEXT,
  why_it_matters TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status public.cluster_status NOT NULL DEFAULT 'active',
  top_entities TEXT[] DEFAULT '{}',
  top_keywords TEXT[] DEFAULT '{}',
  source_count INTEGER DEFAULT 0,
  article_count INTEGER DEFAULT 0,
  relevance_score NUMERIC(5,2) DEFAULT 50.00,
  recency_score NUMERIC(5,2) DEFAULT 50.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.event_clusters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own clusters" ON public.event_clusters FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Event cluster articles (many-to-many)
CREATE TABLE public.event_cluster_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES public.event_clusters(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  relevance_score NUMERIC(3,2) DEFAULT 0.80,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cluster_id, article_id)
);
ALTER TABLE public.event_cluster_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cluster articles" ON public.event_cluster_articles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.event_clusters c WHERE c.id = cluster_id AND c.user_id = auth.uid()));

-- Named entities
CREATE TABLE public.named_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- country, company, person, institution, product, etc.
  mention_count INTEGER DEFAULT 0,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name, entity_type)
);
ALTER TABLE public.named_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own entities" ON public.named_entities FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Article entities (many-to-many)
CREATE TABLE public.article_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES public.named_entities(id) ON DELETE CASCADE,
  relevance NUMERIC(3,2) DEFAULT 0.80,
  UNIQUE(article_id, entity_id)
);
ALTER TABLE public.article_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own article entities" ON public.article_entities FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.articles a WHERE a.id = article_id AND a.user_id = auth.uid()));

-- Article theme links
CREATE TABLE public.article_theme_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES public.macro_themes(id) ON DELETE CASCADE,
  confidence NUMERIC(3,2) DEFAULT 0.80,
  UNIQUE(article_id, theme_id)
);
ALTER TABLE public.article_theme_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own article themes" ON public.article_theme_links FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.articles a WHERE a.id = article_id AND a.user_id = auth.uid()));

-- Cluster theme links
CREATE TABLE public.cluster_theme_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES public.event_clusters(id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES public.macro_themes(id) ON DELETE CASCADE,
  confidence NUMERIC(3,2) DEFAULT 0.80,
  UNIQUE(cluster_id, theme_id)
);
ALTER TABLE public.cluster_theme_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cluster themes" ON public.cluster_theme_links FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.event_clusters c WHERE c.id = cluster_id AND c.user_id = auth.uid()));

-- Entity cluster links
CREATE TABLE public.entity_cluster_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public.named_entities(id) ON DELETE CASCADE,
  cluster_id UUID NOT NULL REFERENCES public.event_clusters(id) ON DELETE CASCADE,
  UNIQUE(entity_id, cluster_id)
);
ALTER TABLE public.entity_cluster_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own entity clusters" ON public.entity_cluster_links FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.event_clusters c WHERE c.id = cluster_id AND c.user_id = auth.uid()));

-- Article summaries
CREATE TABLE public.article_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  key_takeaways TEXT[] DEFAULT '{}',
  why_it_matters TEXT,
  implications TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.article_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own summaries" ON public.article_summaries FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.articles a WHERE a.id = article_id AND a.user_id = auth.uid()));

-- Cluster comparisons
CREATE TABLE public.cluster_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES public.event_clusters(id) ON DELETE CASCADE,
  agreements TEXT[] DEFAULT '{}',
  differences TEXT[] DEFAULT '{}',
  tone_analysis TEXT,
  missing_angles TEXT[] DEFAULT '{}',
  timeline_differences TEXT,
  emphasis_analysis JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cluster_comparisons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own comparisons" ON public.cluster_comparisons FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.event_clusters c WHERE c.id = cluster_id AND c.user_id = auth.uid()));

-- Daily briefings
CREATE TABLE public.daily_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.daily_briefings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own briefings" ON public.daily_briefings FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Chat sessions
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  context_type TEXT DEFAULT 'general',
  context_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON public.chat_sessions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources_cited TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own messages" ON public.chat_messages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chat_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));

-- Embeddings
CREATE TABLE public.embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- 'article', 'cluster'
  source_id UUID NOT NULL,
  content_chunk TEXT,
  embedding_vector TEXT, -- placeholder for vector type
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own embeddings" ON public.embeddings FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Retrieval logs
CREATE TABLE public.retrieval_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  results JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.retrieval_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own retrieval logs" ON public.retrieval_logs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chat_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));

-- Bookmarks
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, article_id)
);
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bookmarks" ON public.bookmarks FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- User preferences
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  favorite_topics TEXT[] DEFAULT '{}',
  muted_topics TEXT[] DEFAULT '{}',
  preferred_sources UUID[] DEFAULT '{}',
  briefing_categories TEXT[] DEFAULT '{}',
  view_density TEXT DEFAULT 'detailed',
  default_sort TEXT DEFAULT 'date',
  summary_length TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own prefs" ON public.user_preferences FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
