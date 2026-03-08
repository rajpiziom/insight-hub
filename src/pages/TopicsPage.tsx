import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers, BookOpen, ArrowRight, Clock } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { SourceBadge } from '@/components/ui/source-badge';
import { mockClusters } from '@/data/mockData';

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffH = Math.floor((now.getTime() - d.getTime()) / 3600000);
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TopicsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Topics" description="Major stories and events, clustered by coverage" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockClusters.map((cluster, i) => (
          <motion.div
            key={cluster.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link to={`/topics/${cluster.id}`}>
              <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all group cursor-pointer h-full">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-display font-semibold group-hover:text-primary transition-colors">{cluster.title}</h3>
                  <span className="text-xs text-muted-foreground ml-2 shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatTime(cluster.latest_update)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{cluster.overview}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {cluster.sources.map(s => <SourceBadge key={s} name={s} />)}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {cluster.article_count}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-3">
                  {cluster.top_tags.map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                  ))}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
