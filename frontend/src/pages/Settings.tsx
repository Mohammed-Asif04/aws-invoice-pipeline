import { useState } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Settings as SettingsIcon,
  Bell,
  ShieldAlert,
  Zap,
  Key,
  Save,
  Globe,
  Building,
  Mail,
  CheckCircle2,
} from 'lucide-react';

export default function Settings() {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Form State
  const [config, setConfig] = useState({
    orgName: 'AWS Invoice Processing',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    autoApprovalConfidence: 90,
    duplicateDetection: true,
    strictGstinValidation: false,
    emailAlerts: true,
    dailySummary: true,
    slaAlerts: true,
    apiKey: 'sk_test_1234567890abcdef',
    webhookUrl: 'https://api.yourcompany.com/webhooks/invoices',
  });

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }, 800);
  };

  const handleToggle = (key: keyof typeof config) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <Header
          title="Settings"
          subtitle="Manage your invoice pipelines and view details related to settings."
        />
        <div className="flex items-center gap-2 self-start md:self-center">
          {isSaved && (
            <span className="text-sm font-medium text-emerald-600 flex items-center gap-1.5 animate-in fade-in mr-2">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </span>
          )}
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <span className="animate-spin text-lg leading-none">⟳</span> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* General Configuration */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border bg-muted/5">
              <CardTitle className="text-base font-semibold font-heading flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                General Configuration
              </CardTitle>
              <CardDescription className="text-xs">Basic system preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Organization Name</label>
                <input
                  type="text"
                  value={config.orgName}
                  onChange={(e) => setConfig({ ...config, orgName: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Default Currency</label>
                <select
                  value={config.currency}
                  onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Timezone</label>
                <select
                  value={config.timezone}
                  onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Integration & API */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border bg-muted/5">
              <CardTitle className="text-base font-semibold font-heading flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-500" />
                Integration & API
              </CardTitle>
              <CardDescription className="text-xs">Connect external systems</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>API Key</span>
                  <span className="text-[10px] text-primary cursor-pointer hover:underline">Regenerate</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={config.apiKey}
                    readOnly
                    className="w-full h-9 rounded-md border border-input bg-muted/50 px-3 py-1 text-sm shadow-sm text-muted-foreground focus:outline-none"
                  />
                  <Key className="w-4 h-4 absolute right-3 top-2.5 text-muted-foreground/50" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Webhook URL</label>
                <input
                  type="url"
                  value={config.webhookUrl}
                  onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="https://..."
                />
                <p className="text-[10px] text-muted-foreground mt-1">Receives POST events on successful invoice processing.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI & Pipeline Engine */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border bg-muted/5">
              <CardTitle className="text-base font-semibold font-heading flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                AI & Pipeline Engine
              </CardTitle>
              <CardDescription className="text-xs">Configure Amazon Textract & Bedrock validation logic</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">Auto-Approval Confidence Threshold</label>
                  <span className="px-2.5 py-0.5 rounded bg-primary/10 text-primary font-bold text-xs">{config.autoApprovalConfidence}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={config.autoApprovalConfidence}
                  onChange={(e) => setConfig({ ...config, autoApprovalConfidence: Number(e.target.value) })}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="text-xs text-muted-foreground">
                  Invoices with an OCR extraction confidence score below this threshold will automatically be sent to the Exceptions queue for manual review.
                </p>
              </div>

              <div className="h-px bg-border w-full my-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggle('duplicateDetection')}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      config.duplicateDetection ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${
                        config.duplicateDetection ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground leading-none mb-1.5">Duplicate Detection</h4>
                    <p className="text-xs text-muted-foreground">Flag invoices with the same vendor, amount, and date as exceptions to prevent double-payment.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggle('strictGstinValidation')}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      config.strictGstinValidation ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${
                        config.strictGstinValidation ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground leading-none mb-1.5">Strict GSTIN Validation</h4>
                    <p className="text-xs text-muted-foreground">Automatically block processing if a valid GSTIN format is not found on domestic invoices.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border bg-muted/5">
              <CardTitle className="text-base font-semibold font-heading flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-500" />
                Notification Preferences
              </CardTitle>
              <CardDescription className="text-xs">Manage system alerts and emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Exception Alerts</h4>
                    <p className="text-[11px] text-muted-foreground">Immediate email when an invoice falls into the exception queue.</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('emailAlerts')}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    config.emailAlerts ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${config.emailAlerts ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Daily Summary</h4>
                    <p className="text-[11px] text-muted-foreground">A daily roll-up report of processing volume and total value.</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('dailySummary')}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    config.dailySummary ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${config.dailySummary ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                    <SettingsIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">SLA Breach Warnings</h4>
                    <p className="text-[11px] text-muted-foreground">Alert when an invoice sits in pending review for &gt; 48 hours.</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('slaAlerts')}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    config.slaAlerts ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${config.slaAlerts ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
