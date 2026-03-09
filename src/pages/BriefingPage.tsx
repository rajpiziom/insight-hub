import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RefreshCw, Inbox, ChevronDown, ChevronUp } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { SourceBadge } from '@/components/ui/source-badge';
import { Button } from '@/components/ui/button';
import { categoryColors } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BriefingItem {
  id: string;
  title: string;
  summary: string;
  theme: string;
  source_name: string;
  why_it_matters?: string;
  cluster_id?: string;
  published_at: string;
}

function shortenTitle(title: string, max = 45): string {
  if (title.length <= max) return title;
  const trimmed = title.slice(0, max);
  const lastSpace = trimmed.lastIndexOf(' ');
  return (lastSpace > max * 0.4 ? trimmed.slice(0, lastSpace) : trimmed) + '…';
}

function BriefingTile({ item, index }: { item: BriefingItem; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "bg-card border border-border rounded-xl cursor-pointer transition-all hover:border-primary/30",
        expanded ? "col-span-1 md:col-span-2 lg:col-span-3" : ""
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-sm leading-snug">
              {shortenTitle(item.title)}
            </h3>
          </div>
          <button className="shrink-0 mt-0.5 text-muted-foreground">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {!expanded && (
          <p className="text-xs text-muted-foreground leading-relaxed mt-1.5 line-clamp-2">{item.summary}</p>
        )}

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="text-sm text-muted-foreground leading-relaxed mt-2 mb-2">{item.summary}</p>
              {item.why_it_matters && (
                <p className="text-xs text-primary/80 italic mb-2">Why it matters: {item.why_it_matters}</p>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
                <SourceBadge name={item.source_name} />
                {item.cluster_id && (
                  <Link to={`/topics/${item.cluster_id}`} onClick={(e) => e.stopPropagation()}>
                    <Button variant="default" size="sm" className="text-xs gap-1 h-7">View Event →</Button>
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function BriefingPage() {
  const [items, setItems] = useState<BriefingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const loadBriefing = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('briefing_updates')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (data) {
        setItems(data);
        if (data.length > 0) {
          setLastUpdate(new Date(data[0].published_at));
        }
      }
    } catch (err) {
      console.error('Failed to load briefing:', err);
      toast.error('Failed to load briefing items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBriefing();
  }, []);

  const handleEnrich = async () => {
    setEnriching(true);
    try {
      const { error } = await supabase.functions.invoke('ai-analyze', {
        body: { action: 'enrich-briefing' }
      });

      if (error) throw error;
      
      toast.success('Briefing items enriched');
      await loadBriefing();
    } catch (err: any) {
      toast.error(err.message || 'Failed to enrich briefing');
    } finally {
      setEnriching(false);
    }
  };

  // Group items by theme
  const groupedByTheme = items.reduce((acc, item) => {
    const theme = item.theme || 'Other';
    if (!acc[theme]) acc[theme] = [];
    acc[theme].push(item);
    return acc;
  }, {} as Record<string, BriefingItem[]>);

  const themes = Object.keys(groupedByTheme).sort();
  const isRecent = lastUpdate ? (Date.now() - lastUpdate.getTime()) < 24 * 60 * 60 * 1000 : false;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Daily Briefing"
        description="Key stories from The Economist's World in Brief"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleEnrich} disabled={enriching}>
              <RefreshCw className={cn("w-3.5 h-3.5", enriching && "animate-spin")} /> 
              {enriching ? 'Enriching...' : 'Enrich with AI'}
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-3.5 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-full mb-1" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <h3 className="font-display font-semibold text-lg mb-2">No briefing items yet</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Run the local agent with the briefing sync command to pull the latest from The Economist's World in Brief.
          </p>
        </div>
      ) : (
        <>
          {lastUpdate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 mb-5">
              <Zap className="w-4 h-4 text-primary" />
              <span>
                Last updated: {lastUpdate.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                {!isRecent && <span className="ml-2 text-warning text-xs">(older than 24h)</span>}
              </span>
            </div>
          )}

          <div className="space-y-6">
            {themes.map((theme) => (
              <div key={theme}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className={cn('px-2.5 py-0.5 rounded text-xs font-semibold', categoryColors[theme] || categoryColors.Other)}>
                    {theme}
                  </span>
                  <span className="text-xs text-muted-foreground">{groupedByTheme[theme].length} items</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {groupedByTheme[theme].map((item, i) => (
                    <BriefingTile key={item.id} item={item} index={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
