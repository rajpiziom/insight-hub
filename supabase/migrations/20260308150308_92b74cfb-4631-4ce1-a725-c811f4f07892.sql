
-- Discovery endpoints for premium sources
CREATE TABLE public.source_discovery_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  label text NOT NULL,
  endpoint_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.source_discovery_endpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own discovery endpoints" ON public.source_discovery_endpoints FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Discovered URLs (dedup tracking)
CREATE TABLE public.discovered_urls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  url text NOT NULL,
  title text,
  discovered_at timestamptz NOT NULL DEFAULT now(),
  ingested boolean NOT NULL DEFAULT false,
  article_id uuid REFERENCES public.articles(id) ON DELETE SET NULL,
  UNIQUE(user_id, url)
);
ALTER TABLE public.discovered_urls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own discovered urls" ON public.discovered_urls FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Connector sync runs (history of each sync execution)
CREATE TABLE public.connector_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  urls_discovered integer DEFAULT 0,
  urls_new integer DEFAULT 0,
  articles_imported integer DEFAULT 0,
  errors jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.connector_sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sync runs" ON public.connector_sync_runs FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Add auto_sync_enabled and discovery_scope to sources
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS auto_sync_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS discovery_scope jsonb DEFAULT '[]'::jsonb;
