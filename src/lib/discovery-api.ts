import { supabase } from '@/integrations/supabase/client';
import type { SourceDiscoveryEndpoint, DiscoveredUrl, ConnectorSyncRun } from '@/types/discovery';

// ===== DISCOVERY ENDPOINTS =====
export async function fetchDiscoveryEndpoints(sourceId: string): Promise<SourceDiscoveryEndpoint[]> {
  const { data, error } = await supabase
    .from('source_discovery_endpoints')
    .select('*')
    .eq('source_id', sourceId)
    .order('created_at');
  if (error) throw error;
  return (data || []) as unknown as SourceDiscoveryEndpoint[];
}

export async function createDiscoveryEndpoint(endpoint: Partial<SourceDiscoveryEndpoint>): Promise<SourceDiscoveryEndpoint> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('source_discovery_endpoints')
    .insert({ ...endpoint, user_id: user.id } as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as SourceDiscoveryEndpoint;
}

export async function deleteDiscoveryEndpoint(id: string): Promise<void> {
  const { error } = await supabase.from('source_discovery_endpoints').delete().eq('id', id);
  if (error) throw error;
}

export async function updateDiscoveryEndpoint(id: string, updates: Partial<SourceDiscoveryEndpoint>): Promise<SourceDiscoveryEndpoint> {
  const { data, error } = await supabase
    .from('source_discovery_endpoints')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as SourceDiscoveryEndpoint;
}

// ===== DISCOVERED URLS =====
export async function fetchDiscoveredUrls(sourceId: string, limit = 100): Promise<DiscoveredUrl[]> {
  const { data, error } = await supabase
    .from('discovered_urls')
    .select('*')
    .eq('source_id', sourceId)
    .order('discovered_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as unknown as DiscoveredUrl[];
}

// ===== CONNECTOR SYNC RUNS =====
export async function fetchSyncRuns(sourceId: string, limit = 20): Promise<ConnectorSyncRun[]> {
  const { data, error } = await supabase
    .from('connector_sync_runs')
    .select('*')
    .eq('source_id', sourceId)
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as unknown as ConnectorSyncRun[];
}

// ===== TRIGGER DISCOVERY SYNC =====
export async function triggerDiscoverySync(sourceId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase.functions.invoke('discovery-sync', {
    body: { sourceId, userId: user.id },
  });
  if (error) throw error;
  return data;
}

// ===== SOURCE AUTO-SYNC =====
export async function updateSourceAutoSync(sourceId: string, enabled: boolean, frequency?: string): Promise<void> {
  const updates: Record<string, any> = { auto_sync_enabled: enabled };
  if (frequency) updates.sync_frequency = frequency;
  const { error } = await supabase.from('sources').update(updates).eq('id', sourceId);
  if (error) throw error;
}

export async function updateSourceDiscoveryScope(sourceId: string, scope: { label: string; url: string }[]): Promise<void> {
  const { error } = await supabase.from('sources').update({ discovery_scope: scope } as any).eq('id', sourceId);
  if (error) throw error;
}
