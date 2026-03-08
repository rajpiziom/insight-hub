import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, Clock, Layers, BookOpen, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { SourceBadge } from '@/components/ui/source-badge';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { Button } from '@/components/ui/button';
import { mockBriefing, mockClusters, mockArticles, categoryColors } from '@/data/mockData';
import { cn } from '@/lib/utils';

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const todayBriefing = mockBriefing;
  const recentArticles = [...mockArticles].sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()).slice(0, 5);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Dashboard"
        description="See the story. Compare the coverage. Understand what matters."
        actions={
          <Link to="/briefing">
            <Button variant="outline" className="gap-2">
              <Zap className="w-4 h-4" /> Full Briefing
            </Button>
          </Link>
        }
      />

      {/* Daily Briefing Preview */}
      <motion.section variants={container} initial="hidden" animate="show" className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-primary" />
          <h2 className="font-display font-semibold text-lg">Today's Briefing</h2>
          <span className="text-xs text-muted-foreground">March 8, 2026</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {todayBriefing.sections.map((section) =>
            section.items.map((briefItem, i) => (
              <motion.div
                key={`${section.category}-${i}`}
                variants={item}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn('px-2 py-0.5 rounded text-xs font-semibold', categoryColors[section.category] || categoryColors.Other)}>
                    {section.category}
                  </span>
                </div>
                <h3 className="font-display font-semibold text-sm mb-2 group-hover:text-primary transition-colors">{briefItem.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{briefItem.summary}</p>
                <div className="flex items-center gap-1.5 mt-3">
                  {briefItem.sources.map((s) => (
                    <SourceBadge key={s} name={s} />
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.section>

      {/* Topic Clusters */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold text-lg">Active Topics</h2>
          </div>
          <Link to="/topics">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View All <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockClusters.map((cluster) => (
            <motion.div key={cluster.id} variants={item}>
              <Link to={`/topics/${cluster.id}`}>
                <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all group cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-display font-semibold text-sm group-hover:text-primary transition-colors flex-1">{cluster.title}</h3>
                    <span className="text-xs text-muted-foreground ml-2 shrink-0">{formatTime(cluster.latest_update)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">{cluster.overview}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {cluster.sources.map((s) => (
                        <SourceBadge key={s} name={s} />
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <BookOpen className="w-3 h-3" />
                      {cluster.article_count} articles
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Recent Articles */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold text-lg">Recent Articles</h2>
          </div>
          <Link to="/articles">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View All <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
          {recentArticles.map((article) => (
            <motion.div key={article.id} variants={item}>
              <Link to={`/articles/${article.id}`}>
                <div className="flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-4 hover:border-primary/30 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <SourceBadge name={article.source_name} />
                      <span className="text-xs text-muted-foreground">{formatTime(article.published_at)}</span>
                      <SentimentIndicator sentiment={article.sentiment} showLabel={false} />
                    </div>
                    <h3 className="font-medium text-sm group-hover:text-primary transition-colors truncate">{article.title}</h3>
                    {article.author && <p className="text-xs text-muted-foreground mt-0.5">By {article.author}</p>}
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
