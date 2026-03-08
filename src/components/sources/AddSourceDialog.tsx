import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Check, ChevronRight, AlertCircle, Terminal, Copy, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { premiumSourceTemplates, syncFrequencyLabels, type PremiumSourceTemplate, type SyncFrequency } from '@/types/discovery';
import { createSource } from '@/lib/api';
import { createDiscoveryEndpoint, updateSourceDiscoveryScope } from '@/lib/discovery-api';
import { toast } from 'sonner';

interface AddSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSourceAdded: () => void;
}

type Step = 'select-source' | 'configure' | 'setup-agent';

export function AddSourceDialog({ open, onOpenChange, onSourceAdded }: AddSourceDialogProps) {
  const [step, setStep] = useState<Step>('select-source');
  const [selectedTemplate, setSelectedTemplate] = useState<PremiumSourceTemplate | null>(null);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [syncFrequency, setSyncFrequency] = useState<SyncFrequency>('6h');
  const [autoSync, setAutoSync] = useState(true);
  const [loading, setLoading] = useState(false);
  const [createdSourceId, setCreatedSourceId] = useState<string | null>(null);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const resetState = () => {
    setStep('select-source');
    setSelectedTemplate(null);
    setSelectedSections([]);
    setSyncFrequency('6h');
    setAutoSync(true);
    setLoading(false);
    setCreatedSourceId(null);
    setCopiedCommand(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetState, 200);
  };

  const handleTemplateSelect = (template: PremiumSourceTemplate) => {
    setSelectedTemplate(template);
    setSelectedSections(template.sections.map(s => s.url));
    setSyncFrequency(template.defaultSyncFrequency);
    setStep('configure');
  };

  const toggleSection = (url: string) => {
    setSelectedSections(prev =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const handleCreateSource = async () => {
    if (!selectedTemplate) return;
    setLoading(true);
    try {
      const source = await createSource({
        source_name: selectedTemplate.name,
        source_domain: selectedTemplate.domain,
        source_type: 'local_desktop_agent',
        auth_method: 'local_agent',
        sync_frequency: syncFrequency,
        auto_sync_enabled: autoSync,
        status: 'needs_attention',
        is_active: true,
        connector_settings: { template_id: selectedTemplate.id },
      });

      const scope = selectedTemplate.sections.filter(s => selectedSections.includes(s.url));
      await updateSourceDiscoveryScope(source.id, scope);

      for (const section of scope) {
        await createDiscoveryEndpoint({
          source_id: source.id,
          label: section.label,
          endpoint_url: section.url,
          is_active: true,
        });
      }

      setCreatedSourceId(source.id);
      setStep('setup-agent');
      toast.success(`${selectedTemplate.name} source created`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create source');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const CopyButton = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-muted/80 hover:bg-muted transition-colors"
      title="Copy"
    >
      {copiedCommand === id ? (
        <CheckCircle className="w-3.5 h-3.5 text-green-400" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
      )}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display">
            {step === 'select-source' && 'Add Source'}
            {step === 'configure' && `Configure ${selectedTemplate?.name}`}
            {step === 'setup-agent' && 'Set Up Desktop Agent'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select-source' && 'Choose a premium source to connect via local desktop agent.'}
            {step === 'configure' && 'Select sections to monitor and sync settings.'}
            {step === 'setup-agent' && 'Run the agent on your machine to start syncing articles.'}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Select source */}
          {step === 'select-source' && (
            <motion.div
              key="select-source"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3 py-2"
            >
              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Monitor className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  The desktop agent runs on your machine and uses your Edge browser session to access premium articles. No passwords are stored in the cloud.
                </p>
              </div>
              <div className="space-y-2">
                {premiumSourceTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="w-full flex items-center justify-between gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    <div className="text-left">
                      <p className="font-medium">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Configure sections & sync */}
          {step === 'configure' && selectedTemplate && (
            <motion.div
              key="configure"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5 py-2"
            >
              <div className="space-y-2">
                <Label>Sections to monitor</Label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedTemplate.sections.map(section => (
                    <label
                      key={section.url}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
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

              <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer">
                <Checkbox checked={autoSync} onCheckedChange={v => setAutoSync(!!v)} />
                <div>
                  <p className="text-sm font-medium">Enable auto-sync</p>
                  <p className="text-xs text-muted-foreground">Agent will automatically discover and import new articles on schedule</p>
                </div>
              </label>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setStep('select-source')} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleCreateSource}
                  disabled={loading || selectedSections.length === 0}
                  className="flex-1"
                >
                  {loading ? 'Creating...' : 'Create Source & Set Up Agent'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Agent setup instructions */}
          {step === 'setup-agent' && selectedTemplate && (
            <motion.div
              key="setup-agent"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-2"
            >
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-400">{selectedTemplate.name} source created</p>
                  <p className="text-muted-foreground mt-1">
                    Now set up the desktop agent on your machine to start pulling articles.
                  </p>
                </div>
              </div>

              {/* Prerequisites */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prerequisites</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" />
                    Node.js 18+ installed
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" />
                    Logged into <span className="text-foreground font-medium">{selectedTemplate.domain}</span> in Microsoft Edge
                  </li>
                </ul>
              </div>

              {/* Setup steps */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Setup</p>

                <div className="space-y-2">
                  <p className="text-sm font-medium">1. Install the agent</p>
                  <div className="relative">
                    <pre className="bg-muted/50 border border-border rounded-lg p-3 pr-10 text-xs font-mono overflow-x-auto">
                      <code>{`cd agent\nnpm install\nnpx playwright install chromium`}</code>
                    </pre>
                    <CopyButton text="cd agent && npm install && npx playwright install chromium" id="install" />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">2. Configure</p>
                  <div className="relative">
                    <pre className="bg-muted/50 border border-border rounded-lg p-3 pr-10 text-xs font-mono overflow-x-auto">
                      <code>{`cp .env.example .env\n# Credentials are pre-filled for this app`}</code>
                    </pre>
                    <CopyButton text="cp .env.example .env" id="config" />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">3. Close Edge, then run</p>
                  <div className="relative">
                    <pre className="bg-muted/50 border border-border rounded-lg p-3 pr-10 text-xs font-mono overflow-x-auto">
                      <code>{`npm start sync`}</code>
                    </pre>
                    <CopyButton text="npm start sync" id="sync" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Or run continuously: <code className="bg-muted/50 px-1.5 py-0.5 rounded text-primary">npm start daemon</code>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                <Terminal className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  The agent uses your Edge browser profile to access {selectedTemplate.name} with your subscription. Edge must be closed while the agent runs. No passwords leave your machine.
                </p>
              </div>

              <Button onClick={() => { onSourceAdded(); handleClose(); }} className="w-full">
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
