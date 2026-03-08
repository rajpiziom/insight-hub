import { useParams, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, LayoutList, Columns, Clock, Loader2, Sparkles, ChevronDown, ChevronUp, Newspaper, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { SourceBadge } from '@/components/ui/source-badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import economistLogo from '@/assets/economist-logo.png';
import { toast } from 'sonner';

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// CitedText renders inline citation markers as links
function CitedText({ text, articleIndex, citationQuotes, citationOffset, fromPath }: { 
  text: string; 
  articleIndex: Record<number, { id: string; title: string }>; 
  citationQuotes: { num: number; quote: string }[];
  citationOffset: number;
  fromPath: string;
}) {
  const parts = text.split(/(\[\d+\])/g);
  let localIdx = 0;
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\[(\d+)\]$/);
        if (match) {
          const num = parseInt(match[1]);
          const article = articleIndex[num];
          const quoteEntry = citationQuotes[citationOffset + localIdx];
          localIdx++;
          if (article) {
            const highlightParam = quoteEntry?.quote ? `?highlight=${encodeURIComponent(quoteEntry.quote)}` : '';
            return (
              <Link key={i} to={`/articles/${article.id}${highlightParam}`} state={{ from: fromPath }} className="inline-flex items-center no-underline" title={quoteEntry?.quote || article.title}>
                <span className="text-[10px] font-medium text-primary bg-primary/10 rounded px-1 py-0.5 hover:bg-primary/20 transition-colors cursor-pointer">{num}</span>
              </Link>
            );
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function countCitations(text: string): number {
  return (text.match(/\[\d+\]/g) || []).length;
}

// Expandable update card
function UpdateCard({ update }: { update: { id: string; title: string; summary: string; source_name: string; published_at: string } }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl p-4 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] text-muted-foreground">{formatRelativeTime(update.published_at)}</span>
            <SourceBadge name={update.source_name} />
          </div>
          <h4 className="font-medium text-sm mb-1">{update.title}</h4>
          <p className={cn(
            "text-xs text-muted-foreground leading-relaxed transition-all",
            !expanded && "line-clamp-2"
          )}>
            {update.summary}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 h-7 w-7 p-0"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </div>
  );
}

export default function TopicDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const goBack = () => window.history.back();
  const currentPath = location.pathname;
  const [viewMode, setViewMode] = useState<'list' | 'compare'>('list');
  const [activeMode, setActiveMode] = useState<'explain' | 'updates' | null>(null);
  const [loading, setLoading] = useState(false);
  const [explainText, setExplainText] = useState<string | null>(null);
  const [updatesText, setUpdatesText] = useState<string | null>(null);
  const [articleIndex, setArticleIndex] = useState<Record<number, { id: string; title: string }>>({});
  const [explainQuotes, setExplainQuotes] = useState<{ num: number; quote: string }[]>([]);
  const [updatesQuotes, setUpdatesQuotes] = useState<{ num: number; quote: string }[]>([]);

  const { data: cluster, isLoading: clusterLoading } = useQuery({
    queryKey: ['cluster', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_clusters')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: articles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ['cluster-articles', id],
    queryFn: async () => {
      const { data: links, error } = await supabase
        .from('event_cluster_articles')
        .select('article_id, articles(id, title, source_name, author, published_at, imported_at, body_text, sentiment, topic_tags)')
        .eq('cluster_id', id!)
        .order('added_at', { ascending: false });
      if (error) throw error;
      return (links || []).map(l => l.articles).filter(Boolean) as any[];
    },
    enabled: !!id,
  });

  // Fetch briefing updates for this cluster, ordered chronologically (newest first)
  const { data: briefingUpdates = [] } = useQuery({
    queryKey: ['cluster-updates', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('briefing_updates')
        .select('*')
        .eq('cluster_id', id!)
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  if (clusterLoading || articlesLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!cluster) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <button onClick={goBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p className="text-muted-foreground">Topic not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <button onClick={goBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {/* Cluster header */}
        <div className="bg-card border border-border rounded-2xl p-6 lg:p-8 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn('w-2 h-2 rounded-full', cluster.status === 'active' ? 'bg-success' : 'bg-warning')} />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{cluster.status}</span>
          </div>
          <h1 className="font-display text-2xl font-bold mb-3">{cluster.title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{cluster.overview}</p>
          {cluster.why_it_matters && (
            <p className="text-sm text-primary/80 leading-relaxed mb-4 italic">Why it matters: {cluster.why_it_matters}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> {cluster.article_count} articles from {cluster.source_count} sources
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> Updated {formatTime(cluster.last_updated_at)}
            </span>
            {briefingUpdates.length > 0 && (
              <span className="text-xs text-primary flex items-center gap-1">
                <Bell className="w-3 h-3" /> {briefingUpdates.length} briefing update{briefingUpdates.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mb-5 flex-wrap">
            {(cluster.top_entities || []).map(entity => (
              <span key={entity} className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary">{entity}</span>
            ))}
            {(cluster.top_keywords || []).map(kw => (
              <span key={kw} className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">{kw}</span>
            ))}
          </div>

          {/* AI action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" disabled={loading} onClick={async () => {
              if (explainText) { setActiveMode(activeMode === 'explain' ? null : 'explain'); return; }
              setActiveMode('explain');
              setLoading(true);
              try {
                const { data, error } = await supabase.functions.invoke('ai-analyze', {
                  body: { action: 'summarize-cluster', clusterId: id, mode: 'explain' },
                });
                if (error) throw error;
                setExplainText(data.summary);
                if (data.articleIndex) setArticleIndex(prev => ({ ...prev, ...data.articleIndex }));
                if (data.citationQuotes) setExplainQuotes(data.citationQuotes);
              } catch (err: any) {
                toast.error(err.message || 'Failed');
                setActiveMode(null);
              } finally { setLoading(false); }
            }}>
              {loading && activeMode === 'explain' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {activeMode === 'explain' && explainText ? 'Hide Explainer' : 'Explain the Situation'}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" disabled={loading} onClick={async () => {
              if (updatesText) { setActiveMode(activeMode === 'updates' ? null : 'updates'); return; }
              setActiveMode('updates');
              setLoading(true);
              try {
                const { data, error } = await supabase.functions.invoke('ai-analyze', {
                  body: { action: 'summarize-cluster', clusterId: id, mode: 'updates' },
                });
                if (error) throw error;
                setUpdatesText(data.summary);
                if (data.articleIndex) setArticleIndex(prev => ({ ...prev, ...data.articleIndex }));
                if (data.citationQuotes) setUpdatesQuotes(data.citationQuotes);
              } catch (err: any) {
                toast.error(err.message || 'Failed');
                setActiveMode(null);
              } finally { setLoading(false); }
            }}>
              {loading && activeMode === 'updates' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
              {activeMode === 'updates' && updatesText ? 'Hide Updates' : 'Latest Updates & Outlook'}
            </Button>
          </div>

          {/* AI output panel */}
          {activeMode && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-5 rounded-xl bg-muted/50 border border-border">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> {activeMode === 'explain' ? 'Writing explainer...' : 'Gathering latest updates...'}
                </div>
              ) : (activeMode === 'explain' && explainText) ? (
                <div className="prose prose-sm max-w-none">
                  {(() => {
                    const paragraphs = explainText.split('\n\n');
                    let offset = 0;
                    return paragraphs.map((p, i) => {
                      const el = (
                        <p key={i} className="text-sm leading-relaxed text-foreground/90 mb-3">
                          <CitedText text={p} articleIndex={articleIndex} citationQuotes={explainQuotes} citationOffset={offset} fromPath={currentPath} />
                        </p>
                      );
                      offset += countCitations(p);
                      return el;
                    });
                  })()}
                </div>
              ) : (activeMode === 'updates' && updatesText) ? (
                <div className="space-y-1.5">
                  {(() => {
                    const lines = updatesText.split('\n').filter(l => l.trim());
                    let offset = 0;
                    return lines.map((line, i) => {
                      const bullet = line.replace(/^[-*]\s*/, '');
                      const el = (
                        <div key={i} className="flex items-start gap-2 text-sm leading-relaxed text-foreground/90">
                          <span className="text-muted-foreground mt-1 shrink-0">•</span>
                          <span><CitedText text={bullet} articleIndex={articleIndex} citationQuotes={updatesQuotes} citationOffset={offset} fromPath={currentPath} /></span>
                        </div>
                      );
                      offset += countCitations(bullet);
                      return el;
                    });
                  })()}
                </div>
              ) : null}
              {!loading && Object.keys(articleIndex).length > 0 && (
                <div className="mt-4 pt-3 border-t border-border">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Sources</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(articleIndex).map(([num, art]) => (
                      <Link key={num} to={`/articles/${art.id}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                        <span className="text-[10px] font-medium text-primary bg-primary/10 rounded px-1 py-0.5">{num}</span>{' '}
                        <span className="underline decoration-dotted">{art.title.length > 50 ? art.title.substring(0, 50) + '…' : art.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Tabbed content: Updates + Articles */}
        <Tabs defaultValue={briefingUpdates.length > 0 ? 'updates' : 'articles'} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="updates" className="gap-1.5">
              <Bell className="w-3.5 h-3.5" /> Updates
              {briefingUpdates.length > 0 && (
                <span className="ml-1 text-[10px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5">{briefingUpdates.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="articles" className="gap-1.5">
              <Newspaper className="w-3.5 h-3.5" /> Articles
              <span className="ml-1 text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">{articles.length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="updates">
            {briefingUpdates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No briefing updates yet for this topic.</p>
                <p className="text-xs mt-1">Updates appear here when briefing sources mention this event.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Timeline line */}
                <div className="relative">
                  <div className="absolute left-[11px] top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-3">
                    {briefingUpdates.map((update: any) => (
                      <div key={update.id} className="relative pl-8">
                        <div className="absolute left-[7px] top-4 w-[9px] h-[9px] rounded-full bg-primary border-2 border-background" />
                        <UpdateCard update={update} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="articles">
            <div className="flex items-center gap-2 mb-4">
              <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="gap-1.5">
                <LayoutList className="w-3.5 h-3.5" /> List
              </Button>
              <Button variant={viewMode === 'compare' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('compare')} className="gap-1.5">
                <Columns className="w-3.5 h-3.5" /> Side by Side
              </Button>
            </div>

            <div className={cn(viewMode === 'compare' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-3')}>
              {articles
                .sort((a: any, b: any) => new Date(b.published_at || b.imported_at || 0).getTime() - new Date(a.published_at || a.imported_at || 0).getTime())
                .map((article: any) => (
                <Link key={article.id} to={`/articles/${article.id}`}>
                  <div className="flex items-center gap-4 bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors group">
                    {article.source_name?.toLowerCase().includes('economist') && (
                      <img src={economistLogo} alt="The Economist" className="w-8 h-8 rounded shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-muted-foreground">{formatTime(article.published_at || article.imported_at || '')}</span>
                        <SentimentIndicator sentiment={article.sentiment} showLabel={false} />
                      </div>
                      <h3 className="font-medium text-sm group-hover:text-primary transition-colors mb-2">{article.title}</h3>
                      {article.author && <p className="text-xs text-muted-foreground mb-2">By {article.author}</p>}
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {(article.body_text || '').substring(0, 200)}...
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
