import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, GitCompare, Sparkles, MessageSquare, BookOpen, LayoutList, Columns, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SourceBadge } from '@/components/ui/source-badge';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { mockClusters, mockArticles, mockComparison } from '@/data/mockData';
import { cn } from '@/lib/utils';

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TopicDetailPage() {
  const { id } = useParams();
  const cluster = mockClusters.find(c => c.id === id);
  const articles = mockArticles.filter(a => a.cluster_id === id);
  const [viewMode, setViewMode] = useState<'list' | 'compare'>('list');
  const [showComparison, setShowComparison] = useState(false);
  const comparison = id === 'c1' ? mockComparison : null;

  if (!cluster) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <Link to="/topics" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Topics
        </Link>
        <p className="text-muted-foreground">Topic not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <Link to="/topics" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Topics
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="bg-card border border-border rounded-2xl p-6 lg:p-8 mb-6">
          <h1 className="font-display text-2xl font-bold mb-3">{cluster.title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{cluster.overview}</p>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {cluster.sources.map(s => <SourceBadge key={s} name={s} />)}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> {cluster.article_count} articles
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> Updated {formatTime(cluster.latest_update)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mb-5">
            {cluster.top_tags.map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">{tag}</span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowComparison(!showComparison)}>
              <GitCompare className="w-3.5 h-3.5" /> Compare Coverage
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Summarise Topic
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Ask AI
            </Button>
          </div>
        </div>

        {/* Comparison */}
        {showComparison && comparison && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-card border border-border rounded-2xl p-6 lg:p-8 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <GitCompare className="w-4 h-4 text-primary" />
              <h2 className="font-display font-semibold">Coverage Comparison</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Points of Agreement</h3>
                <ul className="space-y-1.5">
                  {comparison.agreements.map((a, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-success mt-0.5">✓</span> {a}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Key Differences</h3>
                <ul className="space-y-1.5">
                  {comparison.differences.map((d, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-warning mt-0.5">≠</span> {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tone & Framing</h3>
              <p className="text-sm text-muted-foreground">{comparison.tone_analysis}</p>
            </div>

            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Missing Angles</h3>
              <ul className="space-y-1">
                {comparison.missing_angles.map((m, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-destructive mt-0.5">!</span> {m}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* View toggle */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="gap-1.5"
          >
            <LayoutList className="w-3.5 h-3.5" /> List
          </Button>
          <Button
            variant={viewMode === 'compare' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('compare')}
            className="gap-1.5"
          >
            <Columns className="w-3.5 h-3.5" /> Side by Side
          </Button>
        </div>

        {/* Articles */}
        <div className={cn(viewMode === 'compare' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-3')}>
          {articles.map((article) => (
            <Link key={article.id} to={`/articles/${article.id}`}>
              <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors group">
                <div className="flex items-center gap-2 mb-2">
                  <SourceBadge name={article.source_name} />
                  <span className="text-xs text-muted-foreground">{formatTime(article.published_at)}</span>
                  <SentimentIndicator sentiment={article.sentiment} showLabel={false} />
                </div>
                <h3 className="font-medium text-sm group-hover:text-primary transition-colors mb-2">{article.title}</h3>
                {article.author && <p className="text-xs text-muted-foreground mb-2">By {article.author}</p>}
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {article.full_text.substring(0, 200)}...
                </p>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
