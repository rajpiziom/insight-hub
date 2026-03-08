import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hash, BookOpen, Bell, Clock, Search, Loader2, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface TopicSummary {
  tag: string;
  articleCount: number;
  updateCount: number;
  latestActivity: string;
  sources: string[];
  recentTitles: string[];
}

export default function TagTopicsPage() {
  const [search, setSearch] = useState('');

  // Fetch all articles with their topic_tags
  const { data: articles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ['all-articles-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, topic_tags, source_name, published_at, imported_at')
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all briefing updates
  const { data: updates = [], isLoading: updatesLoading } = useQuery({
    queryKey: ['all-briefing-updates-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('briefing_updates')
        .select('id, title, summary, source_name, published_at')
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Build topic index from article tags + briefing keyword matching
  const topics = useMemo(() => {
    const topicMap = new Map<string, TopicSummary>();

    // Index articles by their topic_tags
    for (const article of articles) {
      const tags = (article.topic_tags || []) as string[];
      for (const tag of tags) {
        const normalizedTag = tag.trim();
        if (!normalizedTag) continue;
        
        let topic = topicMap.get(normalizedTag);
        if (!topic) {
          topic = {
            tag: normalizedTag,
            articleCount: 0,
            updateCount: 0,
            latestActivity: article.published_at || article.imported_at || '',
            sources: [],
            recentTitles: [],
          };
          topicMap.set(normalizedTag, topic);
        }
        topic.articleCount++;
        if (!topic.sources.includes(article.source_name)) {
          topic.sources.push(article.source_name);
        }
        if (topic.recentTitles.length < 3) {
          topic.recentTitles.push(article.title);
        }
        // Keep latest activity up to date
        const actDate = new Date(article.published_at || article.imported_at || 0).getTime();
        if (actDate > new Date(topic.latestActivity || 0).getTime()) {
          topic.latestActivity = article.published_at || article.imported_at || '';
        }
      }
    }

    // Match briefing updates to topics by keyword overlap
    for (const update of updates) {
      const updateLower = (update.title + ' ' + update.summary).toLowerCase();
      for (const [tag, topic] of topicMap) {
        const tagWords = tag.toLowerCase().split(/[\s&,]+/).filter(w => w.length > 2);
        const matches = tagWords.filter(w => updateLower.includes(w)).length;
        // Match if most words in the tag appear in the update
        if (matches >= Math.max(1, Math.ceil(tagWords.length * 0.6))) {
          topic.updateCount++;
          const updateDate = new Date(update.published_at || 0).getTime();
          if (updateDate > new Date(topic.latestActivity || 0).getTime()) {
            topic.latestActivity = update.published_at || '';
          }
        }
      }
    }

    // Convert to sorted array (most active first)
    return Array.from(topicMap.values())
      .filter(t => t.articleCount + t.updateCount >= 1)
      .sort((a, b) => {
        // Sort by latest activity, then by total count
        const dateA = new Date(a.latestActivity || 0).getTime();
        const dateB = new Date(b.latestActivity || 0).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return (b.articleCount + b.updateCount) - (a.articleCount + a.updateCount);
      });
  }, [articles, updates]);

  const filtered = search
    ? topics.filter(t => t.tag.toLowerCase().includes(search.toLowerCase()))
    : topics;

  const isLoading = articlesLoading || updatesLoading;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Topics"
        description={`${topics.length} topics tracked across your articles and briefings`}
        actions={
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Hash}
          title={search ? 'No matching topics' : 'No topics yet'}
          description={search ? 'Try a different search term.' : 'Topics are generated from article tags. Import articles to see topics appear.'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((topic, i) => (
            <motion.div key={topic.tag} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Link to={`/tag/${encodeURIComponent(topic.tag)}`}>
                <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all group cursor-pointer h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-primary" />
                      <h3 className="font-display font-semibold text-sm group-hover:text-primary transition-colors">{topic.tag}</h3>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{formatRelative(topic.latestActivity)}</span>
                  </div>

                  {/* Recent titles preview */}
                  <div className="space-y-1 mb-3">
                    {topic.recentTitles.slice(0, 2).map((title, ti) => (
                      <p key={ti} className="text-xs text-muted-foreground line-clamp-1">{title}</p>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {topic.articleCount} article{topic.articleCount !== 1 ? 's' : ''}
                    </span>
                    {topic.updateCount > 0 && (
                      <span className="flex items-center gap-1 text-primary">
                        <Bell className="w-3 h-3" /> {topic.updateCount} update{topic.updateCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="flex items-center gap-1 ml-auto">
                      {topic.sources.length} source{topic.sources.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
