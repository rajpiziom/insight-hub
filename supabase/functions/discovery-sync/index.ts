import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Discovery Sync Edge Function
 * 
 * This function orchestrates automatic discovery and ingestion for premium sources
 * that use browser_session_connector authentication.
 * 
 * Architecture:
 * - This function is called to initiate a sync run
 * - For browser_session_connector sources, actual page fetching must happen
 *   through a local agent or browser extension that has authenticated access
 * - This function manages the sync run state and coordinates with the local connector
 * 
 * Flow:
 * 1. Create a sync run record
 * 2. Fetch discovery endpoints for the source
 * 3. For each endpoint, check for new URLs (placeholder - local agent does actual discovery)
 * 4. Queue new URLs for ingestion
 * 5. Update sync run with results
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sourceId, userId } = await req.json();
    if (!sourceId || !userId) {
      return new Response(JSON.stringify({ error: 'Missing sourceId or userId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the source
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .select('*')
      .eq('id', sourceId)
      .eq('user_id', userId)
      .single();

    if (sourceError || !source) {
      return new Response(JSON.stringify({ error: 'Source not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a sync run
    const { data: syncRun, error: runError } = await supabase
      .from('connector_sync_runs')
      .insert({
        source_id: sourceId,
        user_id: userId,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (runError) {
      throw new Error(`Failed to create sync run: ${runError.message}`);
    }

    // Get discovery endpoints
    const { data: endpoints, error: endpointsError } = await supabase
      .from('source_discovery_endpoints')
      .select('*')
      .eq('source_id', sourceId)
      .eq('is_active', true);

    if (endpointsError) {
      throw new Error(`Failed to fetch endpoints: ${endpointsError.message}`);
    }

    // For browser_session_connector sources, the actual discovery happens via local agent
    // This function sets up the sync run and waits for the agent to report back
    // For now, we'll simulate the discovery flow for RSS and other connectors

    let urlsDiscovered = 0;
    let urlsNew = 0;
    let articlesImported = 0;
    const errors: string[] = [];

    if (source.source_type === 'rss_connector') {
      // RSS: Use the existing ingest-rss function logic
      const feedUrl = source.connector_settings?.feed_url;
      if (feedUrl) {
        try {
          const feedResp = await fetch(feedUrl, {
            headers: { 'User-Agent': 'NewsIntelHub/1.0' },
          });
          if (feedResp.ok) {
            const feedText = await feedResp.text();
            // Simple RSS parsing for item links
            const itemMatches = feedText.match(/<item[\s\S]*?<\/item>/gi) || [];
            urlsDiscovered = itemMatches.length;

            for (const item of itemMatches) {
              const linkMatch = item.match(/<link>([^<]+)<\/link>/i);
              const titleMatch = item.match(/<title>([^<]+)<\/title>/i);
              if (linkMatch && linkMatch[1]) {
                const url = linkMatch[1].trim();
                const title = titleMatch?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() || null;

                // Check if URL already exists
                const { data: existing } = await supabase
                  .from('discovered_urls')
                  .select('id')
                  .eq('user_id', userId)
                  .eq('url', url)
                  .single();

                if (!existing) {
                  urlsNew++;
                  // Insert discovered URL
                  await supabase.from('discovered_urls').insert({
                    source_id: sourceId,
                    user_id: userId,
                    url,
                    title,
                    ingested: false,
                  });
                }
              }
            }
          }
        } catch (err: any) {
          errors.push(`Feed fetch failed: ${err.message}`);
        }
      }
    } else if (source.source_type === 'browser_session_connector') {
      // Browser session connector: actual discovery must happen via local agent
      // Mark the sync run as pending local agent action
      // The agent will call back to update discovered URLs and complete the run

      // Update source status to indicate sync is waiting for agent
      await supabase
        .from('sources')
        .update({ last_sync_at: new Date().toISOString(), status: 'syncing' })
        .eq('id', sourceId);

      // For demo purposes, return immediately - local agent integration is a placeholder
      const { error: updateError } = await supabase
        .from('connector_sync_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          urls_discovered: 0,
          urls_new: 0,
          articles_imported: 0,
          errors: ['Awaiting local agent connection. Install browser extension or desktop agent to enable discovery.'],
        })
        .eq('id', syncRun.id);

      await supabase
        .from('sources')
        .update({ status: 'needs_attention' })
        .eq('id', sourceId);

      return new Response(JSON.stringify({
        syncRunId: syncRun.id,
        status: 'pending_agent',
        message: 'Sync initiated. Local agent required for browser session discovery.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update sync run as completed
    await supabase
      .from('connector_sync_runs')
      .update({
        status: errors.length > 0 ? 'failed' : 'completed',
        completed_at: new Date().toISOString(),
        urls_discovered: urlsDiscovered,
        urls_new: urlsNew,
        articles_imported: articlesImported,
        errors,
      })
      .eq('id', syncRun.id);

    // Update source last_sync_at
    await supabase
      .from('sources')
      .update({
        last_sync_at: new Date().toISOString(),
        last_successful_sync_at: errors.length === 0 ? new Date().toISOString() : source.last_successful_sync_at,
        status: errors.length > 0 ? 'error' : 'connected',
      })
      .eq('id', sourceId);

    // Update endpoints last_checked_at
    for (const ep of endpoints || []) {
      await supabase
        .from('source_discovery_endpoints')
        .update({ last_checked_at: new Date().toISOString() })
        .eq('id', ep.id);
    }

    return new Response(JSON.stringify({
      syncRunId: syncRun.id,
      urlsDiscovered,
      urlsNew,
      articlesImported,
      errors,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('Discovery sync error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
