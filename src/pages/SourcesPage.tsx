import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Rss, Globe, Upload, Monitor, FileText, MoreVertical, CheckCircle, XCircle, Clock, AlertTriangle, Play, Chrome, RefreshCw, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { sourceTypeLabels, sourceStatusLabels } from '@/types';
import { SourceStatusBadge } from '@/components/sources/SourceStatusBadge';
import { AddSourceDialog } from '@/components/sources/AddSourceDialog';
import { fetchSources, deleteSource, updateSource } from '@/lib/api';
import { triggerDiscoverySync } from '@/lib/discovery-api';
import { toast } from 'sonner';
import type { Source, SourceType } from '@/types';
import { cn } from '@/lib/utils';

const typeIcons: Record<SourceType, React.ElementType> = {
  rss_connector: Rss,
  api_connector: Globe,
  manual_url_import: Upload,
  browser_session_connector: Monitor,
  local_desktop_agent: FileText,
  web_extension_connector: Chrome,
};

function formatTime(dateStr: string | null) {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function SourcesPage() {
  const navigate = useNavigate();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  useEffect(() => {
    loadSources();
  }, []);

  async function loadSources() {
    try {
      const data = await fetchSources();
      setSources(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync(id: string) {
    setSyncingId(id);
    try {
      await triggerDiscoverySync(id);
      toast.success('Sync started');
      setTimeout(loadSources, 2000);
    } catch (err: any) {
      toast.error(err.message || 'Sync failed');
    } finally {
      setSyncingId(null);
    }
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    try {
      await updateSource(id, { is_active: !currentActive, status: currentActive ? 'inactive' : 'connected' });
      setSources(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentActive, status: currentActive ? 'inactive' : 'connected' } as Source : s));
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this source? This cannot be undone.')) return;
    try {
      await deleteSource(id);
      setSources(prev => prev.filter(s => s.id !== id));
      toast.success('Source deleted');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  const typeEntries = Object.entries(typeIcons) as [SourceType, React.ElementType][];
  const premiumSources = sources.filter(s => s.source_type === 'browser_session_connector');
  const otherSources = sources.filter(s => s.source_type !== 'browser_session_connector');

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Sources"
        description="Manage your news sources and ingestion connectors"
        actions={
          <Button className="gap-1.5" onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4" /> Add Source
          </Button>
        }
      />

      {/* Source type summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {typeEntries.map(([type, Icon]) => {
          const count = sources.filter(s => s.source_type === type).length;
          return (
            <div key={type} className="bg-card border border-border rounded-xl p-4 text-center">
              <Icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs font-medium">{sourceTypeLabels[type]}</p>
              <p className="text-lg font-display font-bold text-primary">{count}</p>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : sources.length === 0 ? (
        <div className="text-center py-20">
          <Rss className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-2">No sources connected</h3>
          <p className="text-muted-foreground mb-4">Add your first news source to start building your intelligence feed.</p>
          <Button onClick={() => setAddDialogOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> Add Source
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Premium sources section */}
          {premiumSources.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Monitor className="w-4 h-4" /> Premium Sources
              </h2>
              <div className="space-y-2">
                {premiumSources.map((source, i) => {
                  const Icon = typeIcons[source.source_type] || Globe;
                  const autoSync = (source as any).auto_sync_enabled ?? false;
                  return (
                    <motion.div
                      key={source.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => navigate(`/sources/${source.id}`)}
                      className="flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-4 hover:border-primary/30 cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-medium text-sm">{source.source_name}</h3>
                          <SourceStatusBadge status={source.status} autoSyncEnabled={autoSync} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{source.source_domain}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatTime(source.last_successful_sync_at)}
                          </span>
                          <span>{source.article_count} articles</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Other sources section */}
          {otherSources.length > 0 && (
            <div>
              {premiumSources.length > 0 && (
                <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Rss className="w-4 h-4" /> Other Sources
                </h2>
              )}
              <div className="space-y-2">
                {otherSources.map((source, i) => {
                  const Icon = typeIcons[source.source_type] || Globe;
                  const isSyncing = syncingId === source.id;
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
                          <h3 className="font-medium text-sm">{source.source_name}</h3>
                          <SourceStatusBadge status={source.status} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{sourceTypeLabels[source.source_type]}</span>
                          {source.source_domain && <span>{source.source_domain}</span>}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatTime(source.last_successful_sync_at)}
                          </span>
                          <span>{source.article_count} articles</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost" size="sm"
                        onClick={(e) => { e.stopPropagation(); handleSync(source.id); }}
                        disabled={isSyncing}
                        className="gap-1 text-xs"
                      >
                        <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')} />
                        Sync
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        onClick={(e) => { e.stopPropagation(); handleToggleActive(source.id, source.is_active); }}
                        className={cn('gap-1 text-xs', source.is_active ? 'text-success' : 'text-muted-foreground')}
                      >
                        {source.is_active ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {source.is_active ? 'Active' : 'Inactive'}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={e => e.stopPropagation()}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/sources/${source.id}`)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(source.id)} className="text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <AddSourceDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSourceAdded={loadSources}
      />
    </div>
  );
}
