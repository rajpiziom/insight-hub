import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Rss, Globe, Upload, Monitor, FileText, MoreVertical, CheckCircle, XCircle, Clock } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { mockSources, sourceTypeLabels } from '@/data/mockData';
import type { Source } from '@/types';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, React.ElementType> = {
  rss: Rss,
  api: Globe,
  manual: Upload,
  browser: Monitor,
  file: FileText,
};

function formatTime(dateStr: string | null) {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>(mockSources);

  const toggleActive = (id: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, is_active: !s.is_active } : s));
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Sources"
        description="Manage your news sources and data feeds"
        actions={
          <Button className="gap-1.5">
            <Plus className="w-4 h-4" /> Add Source
          </Button>
        }
      />

      {/* Source type cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {(['rss', 'api', 'manual', 'browser', 'file'] as const).map(type => {
          const Icon = typeIcons[type];
          const count = sources.filter(s => s.type === type).length;
          return (
            <div key={type} className="bg-card border border-border rounded-xl p-4 text-center">
              <Icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs font-medium">{sourceTypeLabels[type]}</p>
              <p className="text-lg font-display font-bold text-primary">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Source list */}
      <div className="space-y-2">
        {sources.map((source, i) => {
          const Icon = typeIcons[source.type];
          return (
            <motion.div
              key={source.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-4"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-medium text-sm">{source.name}</h3>
                  <span className={cn(
                    'w-2 h-2 rounded-full shrink-0',
                    source.is_active ? 'bg-success' : 'bg-muted-foreground/30'
                  )} />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{sourceTypeLabels[source.type]}</span>
                  <span>Priority: {source.priority}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatTime(source.last_sync_at)}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  {source.topic_tags.map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                  ))}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleActive(source.id)}
                className={cn('gap-1 text-xs', source.is_active ? 'text-success' : 'text-muted-foreground')}
              >
                {source.is_active ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {source.is_active ? 'Active' : 'Inactive'}
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
