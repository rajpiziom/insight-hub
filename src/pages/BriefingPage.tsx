import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Calendar, RefreshCw, Filter } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { SourceBadge } from '@/components/ui/source-badge';
import { Button } from '@/components/ui/button';
import { mockBriefing, categoryColors } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export default function BriefingPage() {
  const briefing = mockBriefing;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Daily Briefing"
        description="AI-generated overview of today's most important stories"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Regenerate
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Archive
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
        <Zap className="w-4 h-4 text-primary" />
        <span>Generated March 8, 2026 at 6:00 AM</span>
      </div>

      <div className="space-y-8">
        {briefing.sections.map((section, si) => (
          <motion.section
            key={section.category}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.1 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className={cn('px-2.5 py-1 rounded-md text-xs font-semibold', categoryColors[section.category] || categoryColors.Other)}>
                {section.category}
              </span>
            </div>
            <div className="space-y-4">
              {section.items.map((item, ii) => (
                <div key={ii} className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-display font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{item.summary}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {item.sources.map(s => <SourceBadge key={s} name={s} />)}
                    </div>
                    {item.cluster_id && (
                      <Link to={`/topics/${item.cluster_id}`}>
                        <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">
                          View Topic →
                        </Button>
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
