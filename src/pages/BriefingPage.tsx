import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Calendar, RefreshCw, Inbox, ChevronDown, ChevronUp } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { SourceBadge } from '@/components/ui/source-badge';
import { Button } from '@/components/ui/button';
import { categoryColors } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { fetchBriefing, generateBriefing } from '@/lib/api';
import { toast } from 'sonner';
import type { DailyBriefing, BriefingContent } from '@/types';

// Client-side noise filter for items that slipped through
const CLIENT_NOISE = [
  /subscribe/i, /sign\s*up/i, /free trial/i, /newsletter/i,
  /log\s*in/i, /mind-expanding/i, /delivered\s+(six|five|seven)\s+days/i,
  /curated\s+news/i, /direct\s+to\s+your\s+inbox/i,
  /behind\s+the\s+scenes/i, /future[- ]gazing/i,
  /predictions\s+and\s+speculation/i, /tune\s+into\s+captivating/i,
  /registered\s+in\s+england/i, /registered\s+office/i,
  /vat\s+reg/i, /newspaper\s+limited/i, /word\s+of\s+the\s+week/i,
  /copyright\s*©/i, /all\s+rights\s+reserved/i,
  /terms\s+of\s+(use|service)/i, /privacy\s+policy/i, /cookie\s+policy/i,
  /©\s*\d{4}/, /the\s+economist\s+newspaper/i,
  /john\s+adam\s+street/i, /adelphi/i,
];

function isClientNoise(text: string): boolean {
  return CLIENT_NOISE.some(p => p.test(text));
}

/** Shorten a title to fit ~45 chars while keeping meaning */
function shortenTitle(title: string, max = 45): string {
  if (title.length <= max) return title;
  const trimmed = title.slice(0, max);
  const lastSpace = trimmed.lastIndexOf(' ');
  return (lastSpace > max * 0.4 ? trimmed.slice(0, lastSpace) : trimmed) + '…';
}

function BriefingTile({ item, index }: { item: any; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "bg-card border border-border rounded-xl cursor-pointer transition-all hover:border-primary/30",
        expanded ? "col-span-1 md:col-span-2" : ""
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
              <div className="flex items-center justify-between pt-1 border-t border-border mt-2">
                <div className="flex items-center gap-1.5">
                  {item.sources.map((s: string) => <SourceBadge key={s} name={s} />)}
                </div>
                {item.cluster_id && (
                  <Link to={`/topics/${item.cluster_id}`} onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary h-7">View Event →</Button>
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
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const loadBriefing = async () => {
    try {
      let data = await fetchBriefing();
      if (!data) {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        data = await fetchBriefing(yesterday);
      }
      setBriefing(data);
    } catch (err) {
      console.error('Failed to load briefing:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBriefing();
  }, []);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await generateBriefing();
      await loadBriefing();
      toast.success('Briefing regenerated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to regenerate briefing');
    } finally {
      setRegenerating(false);
    }
  };

  const isRecent = briefing
    ? (Date.now() - new Date(briefing.generated_at).getTime()) < 24 * 60 * 60 * 1000
    : false;

  const content: BriefingContent | null = briefing?.content ?? null;
  const sections = content?.sections ?? [];

  // Flatten all items with their theme for the grid
  const allItems = sections.flatMap(section =>
    section.items.map(item => ({ ...item, theme: section.theme }))
  );

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Daily Briefing"
        description="Today's key stories at a glance"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleRegenerate} disabled={regenerating}>
              <RefreshCw className={cn("w-3.5 h-3.5", regenerating && "animate-spin")} /> {regenerating ? 'Generating...' : 'Regenerate'}
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
      ) : !briefing || allItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <h3 className="font-display font-semibold text-lg mb-2">No briefing available</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Briefings are generated automatically when your sources sync. Run the agent to pull the latest stories.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="w-4 h-4 text-primary" />
              <span>
                {new Date(briefing.generated_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                {!isRecent && <span className="ml-2 text-warning text-xs">(older than 24h)</span>}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {sections.map(s => (
                <span key={s.theme} className={cn('px-2 py-0.5 rounded text-[10px] font-semibold', categoryColors[s.theme] || categoryColors.Other)}>
                  {s.theme} ({s.items.length})
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allItems.map((item, i) => (
              <BriefingTile key={i} item={item} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
