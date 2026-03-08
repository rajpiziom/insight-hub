import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, BookOpen, ArrowRight, Bookmark } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { SourceBadge } from '@/components/ui/source-badge';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { Button } from '@/components/ui/button';
import { mockArticles, mockSources } from '@/data/mockData';

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ArticlesPage() {
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');

  const allTopics = [...new Set(mockArticles.flatMap(a => a.topic_tags))];

  const filtered = mockArticles.filter(a => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (sourceFilter !== 'all' && a.source_name !== sourceFilter) return false;
    if (topicFilter !== 'all' && !a.topic_tags.includes(topicFilter)) return false;
    return true;
  }).sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Articles" description={`${mockArticles.length} articles from ${mockSources.filter(s => s.is_active).length} active sources`} />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
          />
        </div>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All Sources</option>
          {mockSources.filter(s => s.is_active).map(s => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>
        <select
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All Topics</option>
          {allTopics.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Article list */}
      <div className="space-y-2">
        {filtered.map((article, i) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Link to={`/articles/${article.id}`}>
              <div className="flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-4 hover:border-primary/30 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <SourceBadge name={article.source_name} />
                    <span className="text-xs text-muted-foreground">{formatTime(article.published_at)}</span>
                    <SentimentIndicator sentiment={article.sentiment} showLabel={false} />
                    {article.is_bookmarked && <Bookmark className="w-3 h-3 text-primary fill-primary" />}
                  </div>
                  <h3 className="font-medium text-sm group-hover:text-primary transition-colors truncate">{article.title}</h3>
                  {article.author && <p className="text-xs text-muted-foreground mt-0.5">By {article.author}</p>}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {article.topic_tags.map(tag => (
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
    </div>
  );
}
