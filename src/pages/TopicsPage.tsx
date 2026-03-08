import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight, Clock, Loader2, Layers } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  const queryClient = useQueryClient();
  const clusteredRef = useRef(false);

  const { data: clusters = [], isLoading } = useQuery({
    queryKey: ['event-clusters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_clusters')
        .select('*')
        .order('last_updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Auto-cluster if no clusters exist
  useEffect(() => {
    if (clusteredRef.current || isLoading || clusters.length > 0) return;
    clusteredRef.current = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.functions.invoke('ai-analyze', {
        body: { action: 'auto-cluster', userId: user.id },
      });
      if (data?.clusters_created > 0) {
        queryClient.invalidateQueries({ queryKey: ['event-clusters'] });
      }
    })();
  }, [isLoading, clusters.length]);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Event Clusters" description={`${clusters.length} active stories clustered from your articles`} />

      {clusters.length === 0 ? (
        <EmptyState icon={Layers} title="No event clusters yet" description="Import articles and clusters will be generated automatically." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clusters.map((cluster, i) => (
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
                    {(cluster.top_entities || []).slice(0, 4).map(e => (
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
      )}
    </div>
  );
}
