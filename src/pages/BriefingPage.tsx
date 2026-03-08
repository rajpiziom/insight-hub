import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Calendar, RefreshCw, Inbox } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { SourceBadge } from '@/components/ui/source-badge';
import { Button } from '@/components/ui/button';
import { categoryColors } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { fetchBriefing, generateBriefing } from '@/lib/api';
import { toast } from 'sonner';
import type { DailyBriefing, BriefingContent } from '@/types';

export default function BriefingPage() {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const loadBriefing = async () => {
    try {
      // Try today first
      let data = await fetchBriefing();
      // If no briefing today, try yesterday (for timezone edge cases)
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

  // Filter sections to only include items from the last 24 hours
  // (the agent already handles this, but we also filter generated_at)
  const isRecent = briefing
    ? (Date.now() - new Date(briefing.generated_at).getTime()) < 24 * 60 * 60 * 1000
    : false;

  const content: BriefingContent | null = briefing?.content ?? null;
  const sections = content?.sections ?? [];

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Daily Briefing"
        description="AI-generated overview of today's most important stories"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleRegenerate} disabled={regenerating}>
              <RefreshCw className={cn("w-3.5 h-3.5", regenerating && "animate-spin")} /> {regenerating ? 'Generating...' : 'Regenerate'}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5"><Calendar className="w-3.5 h-3.5" /> Archive</Button>
          </div>
        }
      />

      {loading ? (
        <div className="space-y-6 mt-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/4 mb-3" />
              <div className="h-3 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : !briefing || sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <h3 className="font-display font-semibold text-lg mb-2">No briefing available</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Briefings are generated automatically when your sources sync. Run the agent to pull the latest stories from your configured sources.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
            <Zap className="w-4 h-4 text-primary" />
            <span>
              Generated {new Date(briefing.generated_at).toLocaleString()}
              {!isRecent && (
                <span className="ml-2 text-warning text-xs">(older than 24h)</span>
              )}
            </span>
          </div>

          <div className="space-y-8">
            {sections.map((section, si) => (
              <motion.section key={section.theme} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.1 }}>
                <div className="flex items-center gap-2 mb-4">
                  <span className={cn('px-2.5 py-1 rounded-md text-xs font-semibold', categoryColors[section.theme] || categoryColors.Other)}>
                    {section.theme}
                  </span>
                </div>
                <div className="space-y-4">
                  {section.items.map((item, ii) => (
                    <div key={ii} className="bg-card border border-border rounded-xl p-5">
                      <h3 className="font-display font-semibold mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-2">{item.summary}</p>
                      {item.why_it_matters && (
                        <p className="text-xs text-primary/80 italic mb-3">Why it matters: {item.why_it_matters}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {item.sources.map(s => <SourceBadge key={s} name={s} />)}
                        </div>
                        {item.cluster_id && (
                          <Link to={`/topics/${item.cluster_id}`}>
                            <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">View Topic →</Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
