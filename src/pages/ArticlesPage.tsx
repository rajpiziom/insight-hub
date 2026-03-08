import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowRight, Bookmark, Loader2, Tags } from 'lucide-react';
import economistLogo from '@/assets/economist-logo.png';
import { PageHeader } from '@/components/ui/page-header';
import { SourceBadge } from '@/components/ui/source-badge';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { Button } from '@/components/ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ArticlesPage() {
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [tagging, setTagging] = useState(false);
  const queryClient = useQueryClient();

  const handleTagAll = async () => {
    setTagging(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-analyze', {
        body: { action: 'tag-batch' },
      });
      if (error) throw error;
      toast.success(`Tagged ${data.tagged} of ${data.total} articles`);
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    } catch (err: any) {
      toast.error('Tagging failed: ' + (err.message || 'Unknown error'));
    } finally {
      setTagging(false);
    }
  };

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const { data: sources = [] } = useQuery({
    queryKey: ['sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sources')
        .select('*')
        .eq('is_active', true)
        .order('source_name');
      if (error) throw error;
      return data;
    },
  });

  const allTopics = [...new Set(articles.flatMap(a => a.topic_tags || []))];

  const filtered = articles.filter(a => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (sourceFilter !== 'all' && a.source_name !== sourceFilter) return false;
    if (topicFilter !== 'all' && !(a.topic_tags || []).includes(topicFilter)) return false;
    return true;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Articles" description={`${articles.length} articles from ${sources.length} active sources`} />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search articles..."
            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground" />
        </div>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30">
          <option value="all">All Sources</option>
          {sources.map(s => (
            <option key={s.id} value={s.source_name}>{s.source_name}</option>
          ))}
        </select>
        <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30">
          <option value="all">All Topics</option>
          {allTopics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleTagAll} disabled={tagging}>
          {tagging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Tags className="w-3.5 h-3.5" />}
          {tagging ? 'Tagging...' : 'Auto-Tag All'}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p>No articles found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((article, i) => (
            <motion.div key={article.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Link to={`/articles/${article.id}`}>
                <div className="flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-4 hover:border-primary/30 transition-colors group">
                  {article.source_name.toLowerCase().includes('economist') && (
                    <img src={economistLogo} alt="The Economist" className="w-8 h-8 rounded shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">{formatTime(article.published_at || article.imported_at)}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(article.published_at || article.imported_at)}</span>
                      <SentimentIndicator sentiment={article.sentiment} showLabel={false} />
                      {article.is_bookmarked && <Bookmark className="w-3 h-3 text-primary fill-primary" />}
                    </div>
                    <h3 className="font-medium text-sm group-hover:text-primary transition-colors truncate">{article.title}</h3>
                    {article.author && <p className="text-xs text-muted-foreground mt-0.5">By {article.author}</p>}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {(article.topic_tags || []).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
