import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

let client: ReturnType<typeof createClient> | null = null;
let userId: string | null = null;

export async function getSupabase() {
  if (client && userId) return { supabase: client, userId };

  client = createClient(config.supabaseUrl, config.supabaseAnonKey);

  // Sign in as the app user — this ensures RLS scoping
  const { data, error } = await client.auth.signInWithPassword({
    email: config.userEmail,
    password: config.userPassword,
  });

  if (error || !data.user) {
    throw new Error(`Auth failed: ${error?.message || 'No user returned'}`);
  }

  userId = data.user.id;
  console.log(`✓ Authenticated as ${data.user.email}`);
  return { supabase: client, userId };
}

export interface SourceRow {
  id: string;
  source_name: string;
  source_domain: string | null;
  source_type: string;
  auto_sync_enabled: boolean;
  sync_frequency: string | null;
  status: string;
  discovery_scope: { label: string; url: string }[] | null;
}

export async function fetchSyncableSources(): Promise<SourceRow[]> {
  const { supabase, userId } = await getSupabase();
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .eq('user_id', userId)
    .eq('auto_sync_enabled', true)
    .eq('is_active', true)
    .in('source_type', ['browser_session_connector', 'local_desktop_agent']);

  if (error) throw new Error(`Failed to fetch sources: ${error.message}`);
  return (data || []) as SourceRow[];
}

export async function fetchDiscoveryEndpoints(sourceId: string) {
  const { supabase } = await getSupabase();
  const { data, error } = await supabase
    .from('source_discovery_endpoints')
    .select('*')
    .eq('source_id', sourceId)
    .eq('is_active', true);
  if (error) throw new Error(`Failed to fetch endpoints: ${error.message}`);
  return data || [];
}

export async function isUrlKnown(url: string): Promise<boolean> {
  const { supabase, userId } = await getSupabase();
  const { data } = await supabase
    .from('discovered_urls')
    .select('id')
    .eq('user_id', userId)
    .eq('url', url)
    .maybeSingle();
  return !!data;
}

export async function insertDiscoveredUrl(sourceId: string, url: string, title: string | null) {
  const { supabase, userId } = await getSupabase();
  const { error } = await supabase.from('discovered_urls').insert({
    source_id: sourceId,
    user_id: userId,
    url,
    title,
    ingested: false,
  });
  if (error) console.error(`  ✗ Failed to insert discovered URL: ${error.message}`);
}

export async function insertArticle(sourceId: string, article: {
  canonical_url: string;
  title: string;
  subtitle?: string;
  author?: string;
  body_text: string;
  published_at?: string;
  hero_image_url?: string;
  section?: string;
  content_hash: string;
  source_name: string;
}) {
  const { supabase, userId } = await getSupabase();

  // Check for duplicate by content_hash
  const { data: existing } = await supabase
    .from('articles')
    .select('id')
    .eq('user_id', userId)
    .eq('content_hash', article.content_hash)
    .maybeSingle();

  if (existing) {
    console.log(`  ⊘ Duplicate (hash match): ${article.title}`);
    return { deduplicated: true, articleId: existing.id };
  }

  // Also check by canonical_url
  const { data: existingUrl } = await supabase
    .from('articles')
    .select('id')
    .eq('user_id', userId)
    .eq('canonical_url', article.canonical_url)
    .maybeSingle();

  if (existingUrl) {
    console.log(`  ⊘ Duplicate (URL match): ${article.title}`);
    return { deduplicated: true, articleId: existingUrl.id };
  }

  const { data, error } = await supabase
    .from('articles')
    .insert({
      user_id: userId,
      source_id: sourceId,
      source_name: article.source_name,
      canonical_url: article.canonical_url,
      title: article.title,
      subtitle: article.subtitle || null,
      author: article.author || null,
      body_text: article.body_text,
      published_at: article.published_at || null,
      hero_image_url: article.hero_image_url || null,
      section: article.section || null,
      content_hash: article.content_hash,
      status: 'imported',
      confidence_score: 0.85,
    })
    .select('id')
    .single();

  if (error) {
    console.error(`  ✗ Insert failed: ${error.message}`);
    return { deduplicated: false, articleId: null };
  }

  // Mark discovered URL as ingested
  await supabase
    .from('discovered_urls')
    .update({ ingested: true, article_id: data.id })
    .eq('url', article.canonical_url)
    .eq('user_id', userId);

  // Increment source article count
  await supabase.rpc('', {}).catch(() => {}); // placeholder
  await supabase
    .from('sources')
    .update({ article_count: undefined as any }) // will handle via a separate update
    .eq('id', sourceId);

  return { deduplicated: false, articleId: data.id };
}

export async function createSyncRun(sourceId: string) {
  const { supabase, userId } = await getSupabase();
  const { data, error } = await supabase
    .from('connector_sync_runs')
    .insert({
      source_id: sourceId,
      user_id: userId,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to create sync run: ${error.message}`);
  return data;
}

export async function completeSyncRun(runId: string, results: {
  urls_discovered: number;
  urls_new: number;
  articles_imported: number;
  errors: string[];
}) {
  const { supabase } = await getSupabase();
  await supabase
    .from('connector_sync_runs')
    .update({
      status: results.errors.length > 0 ? 'failed' : 'completed',
      completed_at: new Date().toISOString(),
      urls_discovered: results.urls_discovered,
      urls_new: results.urls_new,
      articles_imported: results.articles_imported,
      errors: results.errors,
    })
    .eq('id', runId);
}

export async function updateSourceSyncStatus(sourceId: string, status: string) {
  const { supabase } = await getSupabase();
  await supabase
    .from('sources')
    .update({
      last_sync_at: new Date().toISOString(),
      status,
      ...(status === 'connected' ? { last_successful_sync_at: new Date().toISOString() } : {}),
    })
    .eq('id', sourceId);
}
