import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, RefreshCw, Play, Pause, Settings2, CheckCircle, XCircle,
  Clock, Newspaper, Globe, AlertCircle, ExternalLink, Trash2, MoreVertical, Plus
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SourceStatusBadge, ConnectorHealthIndicator } from '@/components/sources/SourceStatusBadge';
import { syncFrequencyLabels, premiumSourceTemplates, type SyncFrequency, type ConnectorSyncRun, type SourceDiscoveryEndpoint } from '@/types/discovery';
import { fetchSources, fetchArticles, updateSource } from '@/lib/api';
import { fetchDiscoveryEndpoints, fetchSyncRuns, triggerDiscoverySync, updateSourceAutoSync } from '@/lib/discovery-api';
import { toast } from 'sonner';
import type { Source, Article } from '@/types';
import { cn } from '@/lib/utils';

function formatRelative(dateStr: string | null) {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function SourceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [source, setSource] = useState<Source | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [endpoints, setEndpoints] = useState<SourceDiscoveryEndpoint[]>([]);
  const [syncRuns, setSyncRuns] = useState<ConnectorSyncRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    if (!id) return;
    setLoading(true);
    try {
      const [sourcesData, articlesData, endpointsData, runsData] = await Promise.all([
        fetchSources(),
        fetchArticles({ sourceId: id, limit: 20 }),
        fetchDiscoveryEndpoints(id),
        fetchSyncRuns(id),
      ]);
      const found = sourcesData.find(s => s.id === id);
      setSource(found || null);
      setArticles(articlesData);
      setEndpoints(endpointsData);
      setSyncRuns(runsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncNow() {
    if (!source) return;
    setSyncing(true);
    try {
      await triggerDiscoverySync(source.id);
      toast.success('Sync started');
      // Refresh after a moment
      setTimeout(loadData, 2000);
    } catch (err: any) {
      toast.error(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  async function handleToggleAutoSync(enabled: boolean) {
    if (!source) return;
    try {
      await updateSourceAutoSync(source.id, enabled);
      setSource(prev => prev ? { ...prev, auto_sync_enabled: enabled } as any : null);
      toast.success(enabled ? 'Auto-sync enabled' : 'Auto-sync paused');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleToggleActive(active: boolean) {
    if (!source) return;
    try {
      await updateSource(source.id, { is_active: active, status: active ? 'connected' : 'inactive' });
      setSource(prev => prev ? { ...prev, is_active: active, status: active ? 'connected' : 'inactive' } : null);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleFrequencyChange(freq: string) {
    if (!source) return;
    try {
      await updateSourceAutoSync(source.id, (source as any).auto_sync_enabled ?? false, freq);
      setSource(prev => prev ? { ...prev, sync_frequency: freq } : null);
      toast.success('Sync frequency updated');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!source) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Source not found</p>
        <Button variant="outline" onClick={() => navigate('/sources')} className="mt-4">
          Back to Sources
        </Button>
      </div>
    );
  }

  const isPremium = source.source_type === 'browser_session_connector';
  const template = premiumSourceTemplates.find(t => t.domain === source.source_domain);
  const autoSyncEnabled = (source as any).auto_sync_enabled ?? false;
  const connectorHealth = source.status === 'connected' ? 'healthy' : source.status === 'needs_attention' ? 'pending' : 'disconnected';

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate('/sources')} className="mb-4 -ml-2 gap-1.5">
        <ArrowLeft className="w-4 h-4" /> Sources
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-card border border-border flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">{source.source_name}</h1>
            <p className="text-muted-foreground text-sm">{source.source_domain}</p>
            <div className="flex items-center gap-3 mt-2">
              <SourceStatusBadge status={source.status} autoSyncEnabled={autoSyncEnabled} />
              {isPremium && <ConnectorHealthIndicator health={connectorHealth} />}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSyncNow} disabled={syncing} className="gap-1.5">
            <RefreshCw className={cn('w-4 h-4', syncing && 'animate-spin')} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Connection notice for premium sources needing setup */}
      {isPremium && source.status === 'needs_attention' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/30 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-warning">Browser Session Required</p>
            <p className="text-sm text-muted-foreground mt-1">
              To enable automatic syncing, install the local desktop agent or browser extension and authenticate with your {source.source_name} subscription.
            </p>
            <Button variant="outline" size="sm" className="mt-3 gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" /> Setup Instructions
            </Button>
          </div>
        </motion.div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Articles Imported</p>
          <p className="text-2xl font-display font-bold">{source.article_count}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Last Sync</p>
          <p className="text-lg font-medium">{formatRelative(source.last_sync_at)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Last Successful</p>
          <p className="text-lg font-medium">{formatRelative(source.last_successful_sync_at)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Syncs</p>
          <p className="text-2xl font-display font-bold">{syncRuns.length}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium">Auto-Sync</p>
              <p className="text-xs text-muted-foreground">Automatically discover and import new articles</p>
            </div>
            <Switch checked={autoSyncEnabled} onCheckedChange={handleToggleAutoSync} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Source Active</p>
              <p className="text-xs text-muted-foreground">Enable or disable this source</p>
            </div>
            <Switch checked={source.is_active} onCheckedChange={handleToggleActive} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="font-medium mb-2">Sync Frequency</p>
          <Select value={source.sync_frequency || '1h'} onValueChange={handleFrequencyChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(syncFrequencyLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="articles" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="articles">Recent Articles</TabsTrigger>
          <TabsTrigger value="endpoints">Discovery Scope</TabsTrigger>
          <TabsTrigger value="history">Sync History</TabsTrigger>
        </TabsList>

        <TabsContent value="articles">
          {articles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No articles imported yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {articles.map((article, i) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(`/articles/${article.id}`)}
                  className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/30 cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{article.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{formatRelative(article.published_at)}</span>
                      {article.author && <span>• {article.author}</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="endpoints">
          <div className="space-y-2">
            {endpoints.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Globe className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No discovery endpoints configured</p>
              </div>
            ) : (
              endpoints.map(ep => (
                <div key={ep.id} className="flex items-center justify-between gap-4 p-4 bg-card border border-border rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{ep.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{ep.endpoint_url}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={ep.is_active ? 'default' : 'secondary'}>
                      {ep.is_active ? 'Active' : 'Paused'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Checked {formatRelative(ep.last_checked_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
            {template && (
              <Button variant="outline" className="w-full mt-4 gap-1.5">
                <Plus className="w-4 h-4" /> Add Section
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          {syncRuns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No sync runs yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {syncRuns.map((run, i) => (
                <motion.div
                  key={run.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl"
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    run.status === 'completed' ? 'bg-success/10' : run.status === 'failed' ? 'bg-destructive/10' : 'bg-primary/10'
                  )}>
                    {run.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-success" />
                    ) : run.status === 'failed' ? (
                      <XCircle className="w-4 h-4 text-destructive" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {run.status === 'completed' ? 'Sync completed' : run.status === 'failed' ? 'Sync failed' : 'Syncing...'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelative(run.started_at)} • {run.urls_discovered} discovered, {run.urls_new} new, {run.articles_imported} imported
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
