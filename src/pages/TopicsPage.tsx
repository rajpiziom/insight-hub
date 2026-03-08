import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers, BookOpen, ArrowRight, Clock } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { mockClusters } from '@/data/mockData';
import { cn } from '@/lib/utils';

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
      <PageHeader title="Event Clusters" description="Dynamic stories clustered from imported coverage" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockClusters.map((cluster, i) => (
          <motion.div key={cluster.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={`/topics/${cluster.id}`}>
              <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all group cursor-pointer h-full">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn('w-2 h-2 rounded-full', cluster.status === 'active' ? 'bg-success' : cluster.status === 'developing' ? 'bg-warning' : 'bg-muted-foreground')} />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{cluster.status}</span>
                  <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatTime(cluster.last_updated_at)}
                  </span>
                </div>
                <h3 className="font-display font-semibold group-hover:text-primary transition-colors mb-2">{cluster.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">{cluster.overview}</p>
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  {cluster.top_entities.slice(0, 4).map(e => (
                    <span key={e} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{e}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{cluster.source_count} sources</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {cluster.article_count}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
