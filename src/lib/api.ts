import { supabase } from '@/integrations/supabase/client';
import type { Source, Article, EventCluster, IngestionJob, MacroTheme, NamedEntity, ArticleSummary, ClusterComparison, DailyBriefing, ChatSession, ChatMessage, UserPreferences } from '@/types';

// ===== AUTH =====
export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

// ===== SOURCES =====
export async function fetchSources(): Promise<Source[]> {
  const { data, error } = await supabase.from('sources').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as Source[];
}

export async function createSource(source: Partial<Source>): Promise<Source> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase.from('sources').insert({ ...source, user_id: user.id } as any).select().single();
  if (error) throw error;
  return data as unknown as Source;
}

export async function updateSource(id: string, updates: Partial<Source>): Promise<Source> {
  const { data, error } = await supabase.from('sources').update(updates as any).eq('id', id).select().single();
  if (error) throw error;
  return data as unknown as Source;
}

export async function deleteSource(id: string) {
  const { error } = await supabase.from('sources').delete().eq('id', id);
  if (error) throw error;
}

// ===== ARTICLES =====
export async function fetchArticles(opts?: { sourceId?: string; limit?: number; offset?: number; search?: string }): Promise<Article[]> {
  let query = supabase.from('articles').select('*').order('published_at', { ascending: false });
  if (opts?.sourceId) query = query.eq('source_id', opts.sourceId);
  if (opts?.search) query = query.or(`title.ilike.%${opts.search}%,body_text.ilike.%${opts.search}%`);
  if (opts?.limit) query = query.limit(opts.limit);
  if (opts?.offset) query = query.range(opts.offset, opts.offset + (opts.limit || 50) - 1);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as unknown as Article[];
}

export async function fetchArticle(id: string): Promise<Article | null> {
  const { data, error } = await supabase.from('articles').select('*').eq('id', id).single();
  if (error) return null;
  return data as unknown as Article;
}

export async function updateArticle(id: string, updates: Partial<Article>): Promise<Article> {
  const { data, error } = await supabase.from('articles').update(updates as any).eq('id', id).select().single();
  if (error) throw error;
  return data as unknown as Article;
}

// ===== EVENT CLUSTERS =====
export async function fetchClusters(): Promise<EventCluster[]> {
  const { data, error } = await supabase.from('event_clusters').select('*').order('last_updated_at', { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as EventCluster[];
}

export async function fetchCluster(id: string): Promise<EventCluster | null> {
  const { data, error } = await supabase.from('event_clusters').select('*').eq('id', id).single();
  if (error) return null;
  return data as unknown as EventCluster;
}

export async function fetchClusterArticles(clusterId: string): Promise<Article[]> {
  const { data: links, error: linksError } = await supabase.from('event_cluster_articles').select('article_id').eq('cluster_id', clusterId);
  if (linksError || !links?.length) return [];
  const articleIds = links.map(l => (l as any).article_id);
  const { data, error } = await supabase.from('articles').select('*').in('id', articleIds);
  if (error) throw error;
  return (data || []) as unknown as Article[];
}

// ===== MACRO THEMES =====
export async function fetchThemes(): Promise<MacroTheme[]> {
  const { data, error } = await supabase.from('macro_themes').select('*').order('sort_order');
  if (error) throw error;
  return (data || []) as unknown as MacroTheme[];
}

// ===== NAMED ENTITIES =====
export async function fetchEntities(limit = 50): Promise<NamedEntity[]> {
  const { data, error } = await supabase.from('named_entities').select('*').order('mention_count', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data || []) as unknown as NamedEntity[];
}

// ===== INGESTION JOBS =====
export async function fetchIngestionJobs(limit = 20): Promise<IngestionJob[]> {
  const { data, error } = await supabase.from('ingestion_jobs').select('*, source:sources(source_name, source_type)').order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data || []) as unknown as IngestionJob[];
}

// ===== AI ACTIONS =====
export async function triggerRSSIngestion(sourceId: string, feedUrl: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase.functions.invoke('ingest-rss', {
    body: { sourceId, feedUrl, userId: user.id },
  });
  if (error) throw error;
  return data;
}

export async function triggerURLImport(url: string, opts?: { title?: string; bodyText?: string; author?: string; sourceId?: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase.functions.invoke('ingest-url', {
    body: { url, userId: user.id, ...opts },
  });
  if (error) throw error;
  return data;
}

export async function summarizeArticle(articleId: string) {
  const { data, error } = await supabase.functions.invoke('ai-analyze', {
    body: { action: 'summarize', articleId },
  });
  if (error) throw error;
  return data;
}

export async function compareCoverage(clusterId: string) {
  const { data, error } = await supabase.functions.invoke('ai-analyze', {
    body: { action: 'compare', clusterId },
  });
  if (error) throw error;
  return data;
}

export async function generateBriefing() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase.functions.invoke('ai-analyze', {
    body: { action: 'briefing', userId: user.id },
  });
  if (error) throw error;
  return data;
}

export async function fetchArticleSummary(articleId: string): Promise<ArticleSummary | null> {
  const { data, error } = await supabase.from('article_summaries').select('*').eq('article_id', articleId).single();
  if (error) return null;
  return data as unknown as ArticleSummary;
}

export async function fetchClusterComparison(clusterId: string): Promise<ClusterComparison | null> {
  const { data, error } = await supabase.from('cluster_comparisons').select('*').eq('cluster_id', clusterId).order('created_at', { ascending: false }).limit(1).single();
  if (error) return null;
  return data as unknown as ClusterComparison;
}

// ===== DAILY BRIEFINGS =====
export async function fetchBriefing(date?: string): Promise<DailyBriefing | null> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const { data, error } = await supabase.from('daily_briefings').select('*').eq('date', targetDate).single();
  if (error) return null;
  return data as unknown as DailyBriefing;
}

export async function fetchBriefingHistory(): Promise<DailyBriefing[]> {
  const { data, error } = await supabase.from('daily_briefings').select('*').order('date', { ascending: false }).limit(30);
  if (error) throw error;
  return (data || []) as unknown as DailyBriefing[];
}

// ===== CHAT =====
export async function fetchChatSessions(): Promise<ChatSession[]> {
  const { data, error } = await supabase.from('chat_sessions').select('*').order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as ChatSession[];
}

export async function createChatSession(title?: string): Promise<ChatSession> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase.from('chat_sessions').insert({ user_id: user.id, title: title || 'New Chat' } as any).select().single();
  if (error) throw error;
  return data as unknown as ChatSession;
}

export async function fetchChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase.from('chat_messages').select('*').eq('session_id', sessionId).order('created_at');
  if (error) throw error;
  return (data || []) as unknown as ChatMessage[];
}

export async function saveChatMessage(sessionId: string, role: 'user' | 'assistant', content: string, sourcesCited: string[] = []): Promise<ChatMessage> {
  const { data, error } = await supabase.from('chat_messages').insert({ session_id: sessionId, role, content, sources_cited: sourcesCited } as any).select().single();
  if (error) throw error;
  return data as unknown as ChatMessage;
}

// ===== BOOKMARKS =====
export async function toggleBookmark(articleId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data: existing } = await supabase.from('bookmarks').select('id').eq('user_id', user.id).eq('article_id', articleId).single();
  if (existing) {
    await supabase.from('bookmarks').delete().eq('id', (existing as any).id);
    await supabase.from('articles').update({ is_bookmarked: false } as any).eq('id', articleId);
    return false;
  } else {
    await supabase.from('bookmarks').insert({ user_id: user.id, article_id: articleId } as any);
    await supabase.from('articles').update({ is_bookmarked: true } as any).eq('id', articleId);
    return true;
  }
}

export async function fetchBookmarkedArticles(): Promise<Article[]> {
  const { data, error } = await supabase.from('articles').select('*').eq('is_bookmarked', true).order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as Article[];
}

// ===== USER PREFERENCES =====
export async function fetchPreferences(): Promise<UserPreferences | null> {
  const { data, error } = await supabase.from('user_preferences').select('*').single();
  if (error) return null;
  return data as unknown as UserPreferences;
}

export async function savePreferences(prefs: Partial<UserPreferences>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase.from('user_preferences').upsert({ ...prefs, user_id: user.id } as any, { onConflict: 'user_id' }).select().single();
  if (error) throw error;
  return data as unknown as UserPreferences;
}

// ===== STREAMING CHAT =====
export async function streamChat({
  messages,
  sessionId,
  contextType,
  contextId,
  onDelta,
  onDone,
}: {
  messages: { role: string; content: string }[];
  sessionId?: string;
  contextType?: string;
  contextId?: string;
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, sessionId, contextType, contextId }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Stream failed' }));
    throw new Error(err.error || `Stream failed: ${resp.status}`);
  }

  if (!resp.body) throw new Error('No response body');

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = '';
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') { streamDone = true; break; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + '\n' + textBuffer;
        break;
      }
    }
  }

  // Final flush
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split('\n')) {
      if (!raw) continue;
      if (raw.endsWith('\r')) raw = raw.slice(0, -1);
      if (raw.startsWith(':') || raw.trim() === '') continue;
      if (!raw.startsWith('data: ')) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {}
    }
  }

  onDone();
}
