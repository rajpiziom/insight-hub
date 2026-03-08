import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Bell, Palette, LayoutGrid } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const allTopics = ['markets', 'macro', 'technology', 'geopolitics', 'business', 'ai', 'regulation', 'china', 'fed'];

export default function SettingsPage() {
  const [favoriteTopics, setFavoriteTopics] = useState(['markets', 'macro', 'technology']);
  const [mutedTopics, setMutedTopics] = useState<string[]>([]);
  const [density, setDensity] = useState<'compact' | 'detailed'>('detailed');
  const [sortMode, setSortMode] = useState('date');
  const [summaryLength, setSummaryLength] = useState('medium');

  const toggleFavorite = (topic: string) => {
    setFavoriteTopics(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]);
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <PageHeader title="Settings" description="Customize your News Intelligence Hub experience" />

      <div className="space-y-8">
        {/* Favorite Topics */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <LayoutGrid className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold">Favorite Topics</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Select topics you want to prioritize in your feed and briefings.</p>
          <div className="flex flex-wrap gap-2">
            {allTopics.map(topic => (
              <button
                key={topic}
                onClick={() => toggleFavorite(topic)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                  favoriteTopics.includes(topic)
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                )}
              >
                {topic}
              </button>
            ))}
          </div>
        </motion.section>

        {/* View Preferences */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold">Display Preferences</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-2 block">View Density</label>
              <div className="flex gap-2">
                {(['compact', 'detailed'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setDensity(d)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium border transition-all capitalize',
                      density === d ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-transparent'
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Default Sort</label>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
                className="bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="date">Date</option>
                <option value="relevance">Relevance</option>
                <option value="source">Source</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">AI Summary Length</label>
              <div className="flex gap-2">
                {(['short', 'medium', 'long'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setSummaryLength(l)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium border transition-all capitalize',
                      summaryLength === l ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-transparent'
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Account */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold">Account</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Manage your account settings and authentication.</p>
          <Button variant="outline" size="sm">Sign Out</Button>
        </motion.section>
      </div>
    </div>
  );
}
