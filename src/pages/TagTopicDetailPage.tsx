import { useParams, Link, useLocation } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Hash, BookOpen, Bell, Clock, ChevronDown, ChevronUp, Loader2, LayoutList, Columns } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SourceBadge } from '@/components/ui/source-badge';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import economistLogo from '@/assets/economist-logo.png';

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
        <Button variant="ghost" size="sm" className="shrink-0 h-7 w-7 p-0" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </div>
  );
}

export default function TagTopicDetailPage() {
  const { tag } = useParams();
  const decodedTag = decodeURIComponent(tag || '');
  const goBack = () => window.history.back();
  const [viewMode, setViewMode] = useState<'list' | 'compare'>('list');

  // Fetch articles matching this tag
  const { data: articles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ['tag-articles', decodedTag],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, source_name, author, published_at, imported_at, body_text, sentiment, topic_tags')
        .contains('topic_tags', [decodedTag])
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!decodedTag,
  });

  // Fetch briefing updates and match by keyword
  const { data: allUpdates = [], isLoading: updatesLoading } = useQuery({
    queryKey: ['tag-updates', decodedTag],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('briefing_updates')
        .select('*')
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!decodedTag,
  });

  // Filter updates that match this topic tag
  const matchedUpdates = useMemo(() => {
    const tagWords = decodedTag.toLowerCase().split(/[\s&,]+/).filter(w => w.length > 2);
    return allUpdates.filter(update => {
      const text = (update.title + ' ' + update.summary).toLowerCase();
      const matches = tagWords.filter(w => text.includes(w)).length;
      return matches >= Math.max(1, Math.ceil(tagWords.length * 0.6));
    });
  }, [allUpdates, decodedTag]);

  // Combined timeline: both articles and updates, sorted chronologically (newest first)
  const timeline = useMemo(() => {
    const items: { type: 'article' | 'update'; date: string; data: any }[] = [];
    for (const a of articles) {
      items.push({ type: 'article', date: a.published_at || a.imported_at || '', data: a });
    }
    for (const u of matchedUpdates) {
      items.push({ type: 'update', date: u.published_at || '', data: u });
    }
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [articles, matchedUpdates]);

  const isLoading = articlesLoading || updatesLoading;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const uniqueSources = [...new Set(articles.map(a => a.source_name))];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <button onClick={goBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {/* Topic header */}
        <div className="bg-card border border-border rounded-2xl p-6 lg:p-8 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="w-5 h-5 text-primary" />
            <h1 className="font-display text-2xl font-bold">{decodedTag}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> {articles.length} article{articles.length !== 1 ? 's' : ''}
            </span>
            {matchedUpdates.length > 0 && (
              <span className="text-xs text-primary flex items-center gap-1">
                <Bell className="w-3 h-3" /> {matchedUpdates.length} briefing update{matchedUpdates.length !== 1 ? 's' : ''}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {uniqueSources.length} source{uniqueSources.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {uniqueSources.map(s => <SourceBadge key={s} name={s} />)}
          </div>
        </div>

        {/* Tabbed content */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all" className="gap-1.5">
              <Clock className="w-3.5 h-3.5" /> All Activity
              <span className="ml-1 text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">{timeline.length}</span>
            </TabsTrigger>
            <TabsTrigger value="articles" className="gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Articles
              <span className="ml-1 text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">{articles.length}</span>
            </TabsTrigger>
            {matchedUpdates.length > 0 && (
              <TabsTrigger value="updates" className="gap-1.5">
                <Bell className="w-3.5 h-3.5" /> Updates
                <span className="ml-1 text-[10px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5">{matchedUpdates.length}</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* All Activity — combined chronological timeline */}
          <TabsContent value="all">
            <div className="relative">
              <div className="absolute left-[11px] top-0 bottom-0 w-px bg-border" />
              <div className="space-y-3">
                {timeline.map((item, i) => (
                  <div key={`${item.type}-${item.data.id}`} className="relative pl-8">
                    <div className={cn(
                      "absolute left-[7px] top-4 w-[9px] h-[9px] rounded-full border-2 border-background",
                      item.type === 'update' ? 'bg-primary' : 'bg-muted-foreground'
                    )} />
                    {item.type === 'update' ? (
                      <UpdateCard update={item.data} />
                    ) : (
                      <Link to={`/articles/${item.data.id}`}>
                        <div className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors group">
                          {item.data.source_name?.toLowerCase().includes('economist') && (
                            <img src={economistLogo} alt="The Economist" className="w-7 h-7 rounded shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] text-muted-foreground">{formatTime(item.data.published_at || item.data.imported_at || '')}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Article</span>
                              <SentimentIndicator sentiment={item.data.sentiment} showLabel={false} />
                            </div>
                            <h3 className="font-medium text-sm group-hover:text-primary transition-colors mb-1">{item.data.title}</h3>
                            {item.data.author && <p className="text-[10px] text-muted-foreground">By {item.data.author}</p>}
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Articles only */}
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
              {articles.map((article: any) => (
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

          {/* Updates only */}
          {matchedUpdates.length > 0 && (
            <TabsContent value="updates">
              <div className="relative">
                <div className="absolute left-[11px] top-0 bottom-0 w-px bg-border" />
                <div className="space-y-3">
                  {matchedUpdates.map((update: any) => (
                    <div key={update.id} className="relative pl-8">
                      <div className="absolute left-[7px] top-4 w-[9px] h-[9px] rounded-full bg-primary border-2 border-background" />
                      <UpdateCard update={update} />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </motion.div>
    </div>
  );
}
