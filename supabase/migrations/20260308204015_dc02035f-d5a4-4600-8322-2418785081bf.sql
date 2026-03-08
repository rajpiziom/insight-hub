
-- Briefing updates linked to event clusters
CREATE TABLE public.briefing_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cluster_id uuid REFERENCES public.event_clusters(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text NOT NULL,
  source_name text NOT NULL DEFAULT 'The Economist',
  content_hash text NOT NULL,
  published_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_hash)
);

ALTER TABLE public.briefing_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own briefing updates"
  ON public.briefing_updates
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Index for fast cluster lookups
CREATE INDEX idx_briefing_updates_cluster ON public.briefing_updates(cluster_id);
CREATE INDEX idx_briefing_updates_user_date ON public.briefing_updates(user_id, published_at DESC);
