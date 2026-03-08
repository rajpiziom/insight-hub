import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Rss, Globe, Upload, Monitor, FileText, Chrome, Check, ChevronRight, ExternalLink, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { premiumSourceTemplates, syncFrequencyLabels, type PremiumSourceTemplate, type SyncFrequency } from '@/types/discovery';
import { sourceTypeLabels, type SourceType } from '@/types';
import { createSource } from '@/lib/api';
import { createDiscoveryEndpoint, updateSourceDiscoveryScope } from '@/lib/discovery-api';
import { toast } from 'sonner';

const sourceTypeOptions: { type: SourceType; icon: React.ElementType; description: string }[] = [
  { type: 'rss_connector', icon: Rss, description: 'Subscribe to an RSS/Atom feed' },
  { type: 'manual_url_import', icon: Upload, description: 'Paste article URLs manually' },
  { type: 'browser_session_connector', icon: Monitor, description: 'Premium sources via authenticated browser session' },
  { type: 'api_connector', icon: Globe, description: 'Connect via official API' },
  { type: 'local_desktop_agent', icon: FileText, description: 'Local desktop agent (coming soon)' },
  { type: 'web_extension_connector', icon: Chrome, description: 'Browser extension (coming soon)' },
];

interface AddSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSourceAdded: () => void;
}

type Step = 'type' | 'premium-select' | 'premium-configure' | 'rss' | 'manual';

export function AddSourceDialog({ open, onOpenChange, onSourceAdded }: AddSourceDialogProps) {
  const [step, setStep] = useState<Step>('type');
  const [selectedType, setSelectedType] = useState<SourceType | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PremiumSourceTemplate | null>(null);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [syncFrequency, setSyncFrequency] = useState<SyncFrequency>('6h');
  const [autoSync, setAutoSync] = useState(true);
  const [rssUrl, setRssUrl] = useState('');
  const [rssName, setRssName] = useState('');
  const [loading, setLoading] = useState(false);

  const resetState = () => {
    setStep('type');
    setSelectedType(null);
    setSelectedTemplate(null);
    setSelectedSections([]);
    setSyncFrequency('6h');
    setAutoSync(true);
    setRssUrl('');
    setRssName('');
    setLoading(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetState, 200);
  };

  const handleTypeSelect = (type: SourceType) => {
    setSelectedType(type);
    if (type === 'browser_session_connector') {
      setStep('premium-select');
    } else if (type === 'rss_connector') {
      setStep('rss');
    } else if (type === 'manual_url_import') {
      setStep('manual');
    } else {
      toast.info('This connector type is coming soon');
    }
  };

  const handleTemplateSelect = (template: PremiumSourceTemplate) => {
    setSelectedTemplate(template);
    setSelectedSections(template.sections.slice(0, 3).map(s => s.url));
    setSyncFrequency(template.defaultSyncFrequency);
    setStep('premium-configure');
  };

  const toggleSection = (url: string) => {
    setSelectedSections(prev =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const handleCreatePremiumSource = async () => {
    if (!selectedTemplate) return;
    setLoading(true);
    try {
      const source = await createSource({
        source_name: selectedTemplate.name,
        source_domain: selectedTemplate.domain,
        source_type: 'browser_session_connector',
        auth_method: 'browser_session',
        sync_frequency: syncFrequency,
        status: 'needs_attention',
        is_active: true,
        connector_settings: { template_id: selectedTemplate.id },
      });

      // Update discovery scope
      const scope = selectedTemplate.sections.filter(s => selectedSections.includes(s.url));
      await updateSourceDiscoveryScope(source.id, scope);

      // Create discovery endpoints
      for (const section of scope) {
        await createDiscoveryEndpoint({
          source_id: source.id,
          label: section.label,
          endpoint_url: section.url,
          is_active: true,
        });
      }

      toast.success(`${selectedTemplate.name} source created`);
      onSourceAdded();
      handleClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create source');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRssSource = async () => {
    if (!rssUrl.trim()) return;
    setLoading(true);
    try {
      await createSource({
        source_name: rssName || new URL(rssUrl).hostname,
        source_domain: new URL(rssUrl).hostname,
        source_type: 'rss_connector',
        auth_method: 'rss',
        sync_frequency: '1h',
        status: 'connected',
        is_active: true,
        connector_settings: { feed_url: rssUrl },
      });
      toast.success('RSS source added');
      onSourceAdded();
      handleClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create source');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display">
            {step === 'type' && 'Add Source'}
            {step === 'premium-select' && 'Select Premium Source'}
            {step === 'premium-configure' && `Configure ${selectedTemplate?.name}`}
            {step === 'rss' && 'Add RSS Feed'}
            {step === 'manual' && 'Manual Import'}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'type' && (
            <motion.div
              key="type"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-2 gap-3 py-4"
            >
              {sourceTypeOptions.map(({ type, icon: Icon, description }) => (
                <button
                  key={type}
                  onClick={() => handleTypeSelect(type)}
                  className="flex flex-col items-start gap-2 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
                >
                  <Icon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{sourceTypeLabels[type]}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {step === 'premium-select' && (
            <motion.div
              key="premium-select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3 py-4"
            >
              <p className="text-sm text-muted-foreground">
                Connect a premium news source using your existing subscription via browser session.
              </p>
              <div className="space-y-2">
                {premiumSourceTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="w-full flex items-center justify-between gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    <div className="text-left">
                      <p className="font-medium">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.domain}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
              <Button variant="ghost" onClick={() => setStep('type')} className="w-full mt-2">
                Back
              </Button>
            </motion.div>
          )}

          {step === 'premium-configure' && selectedTemplate && (
            <motion.div
              key="premium-configure"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5 py-4"
            >
              {/* Connection notice */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/30">
                <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Browser Session Required</p>
                  <p className="text-muted-foreground mt-1">
                    After creating this source, you'll need to connect it using a local browser extension or desktop agent that has access to your authenticated {selectedTemplate.name} session.
                  </p>
                </div>
              </div>

              {/* Section selection */}
              <div className="space-y-2">
                <Label>Sections to monitor</Label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedTemplate.sections.map(section => (
                    <label
                      key={section.url}
                      className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedSections.includes(section.url)}
                        onCheckedChange={() => toggleSection(section.url)}
                      />
                      <span className="text-sm">{section.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sync frequency */}
              <div className="space-y-2">
                <Label>Sync frequency</Label>
                <Select value={syncFrequency} onValueChange={v => setSyncFrequency(v as SyncFrequency)}>
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

              {/* Auto-sync toggle */}
              <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer">
                <Checkbox
                  checked={autoSync}
                  onCheckedChange={v => setAutoSync(!!v)}
                />
                <div>
                  <p className="text-sm font-medium">Enable auto-sync</p>
                  <p className="text-xs text-muted-foreground">Automatically discover and import new articles</p>
                </div>
              </label>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep('premium-select')} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleCreatePremiumSource}
                  disabled={loading || selectedSections.length === 0}
                  className="flex-1"
                >
                  {loading ? 'Creating...' : 'Create Source'}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'rss' && (
            <motion.div
              key="rss"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-4"
            >
              <div className="space-y-2">
                <Label htmlFor="rss-url">Feed URL</Label>
                <Input
                  id="rss-url"
                  placeholder="https://example.com/rss.xml"
                  value={rssUrl}
                  onChange={e => setRssUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rss-name">Source Name (optional)</Label>
                <Input
                  id="rss-name"
                  placeholder="My News Source"
                  value={rssName}
                  onChange={e => setRssName(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep('type')} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleCreateRssSource} disabled={loading || !rssUrl.trim()} className="flex-1">
                  {loading ? 'Adding...' : 'Add Feed'}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'manual' && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-4"
            >
              <p className="text-sm text-muted-foreground">
                You can import individual articles from the Articles page using the "Import URL" button.
              </p>
              <Button variant="outline" onClick={() => setStep('type')} className="w-full">
                Back
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
