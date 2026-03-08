import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Calendar, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { SourceBadge } from '@/components/ui/source-badge';
import { Button } from '@/components/ui/button';
import { mockBriefing, categoryColors } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { generateBriefing } from '@/lib/api';
import { toast } from 'sonner';

export default function BriefingPage() {
  const briefing = mockBriefing;
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await generateBriefing();
      toast.success('Briefing regenerated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to regenerate briefing');
    } finally {
      setRegenerating(false);
    }
  };

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

      <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
        <Zap className="w-4 h-4 text-primary" />
        <span>Generated {briefing.generated_at ? new Date(briefing.generated_at).toLocaleString() : 'Today'}</span>
      </div>

      <div className="space-y-8">
        {briefing.content.sections.map((section, si) => (
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
    </div>
  );
}
