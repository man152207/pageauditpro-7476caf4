import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Brain,
  CheckCircle2,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Facebook,
  Loader2,
  Mail,
  Save,
  Wallet,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface IntegrationCardProps {
  title: string;
  icon: React.ReactNode;
  isConfigured: boolean;
  children: React.ReactNode;
  onSave: () => void;
  saving: boolean;
  onTest?: () => void;
  testing?: boolean;
  dirty?: boolean;
}

function IntegrationCard({ title, icon, isConfigured, children, onSave, saving, onTest, testing, dirty }: IntegrationCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          {icon}
          {title}
        </h3>
        <Badge variant="outline" className={isConfigured ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}>
          {isConfigured ? <><CheckCircle2 className="mr-1 h-3 w-3" /> Configured</> : 'Not Configured'}
        </Badge>
      </div>
      {children}
      <div className="flex items-center gap-2 pt-2">
        <Button onClick={onSave} disabled={saving} size="sm">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save
        </Button>
        {onTest && (
          <Button onClick={onTest} disabled={testing || dirty} size="sm" variant="outline" title={dirty ? 'Save your changes first' : undefined}>
            {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Test Connection
          </Button>
        )}
        {dirty && <span className="text-xs text-warning">Save changes before testing</span>}
      </div>
    </div>
  );
}

interface SecretInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helpText?: string;
}

function SecretInput({ id, label, value, onChange, placeholder, helpText }: SecretInputProps) {
  const [show, setShow] = useState(false);
  const { toast } = useToast();

  const copyValue = () => {
    if (value && value !== '••••••••') {
      navigator.clipboard.writeText(value);
      toast({ title: 'Copied to clipboard' });
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative flex gap-1">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder || '••••••••'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-20"
        />
        <Button type="button" variant="ghost" size="icon" onClick={() => setShow(!show)} className="shrink-0">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={copyValue} className="shrink-0">
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
    </div>
  );
}

interface IntegrationSettingsProps {
  settings: Record<string, string>;
  updateSetting: (key: string, value: string) => void;
  saveSettings: (settings: Array<{ key: string; value: string; is_sensitive: boolean }>) => Promise<void>;
  saving: boolean;
}

function validateStripeSecretKey(key: string): { valid: boolean; error?: string } {
  const trimmed = key.trim();
  if (!trimmed || trimmed === '••••••••') return { valid: true };
  if (trimmed.startsWith('pk_')) return { valid: false, error: 'This is a PUBLISHABLE key (pk_). Use the SECRET key (sk_live_... or sk_test_...).' };
  if (trimmed.startsWith('whsec_')) return { valid: false, error: 'This is a webhook signing secret. Use the SECRET key (sk_live_... or sk_test_...).' };
  if (trimmed.startsWith('rk_')) return { valid: false, error: 'This is a RESTRICTED key. Use the full Secret key (sk_live_... or sk_test_...).' };
  if (trimmed.startsWith('mk_')) return { valid: false, error: 'Invalid key format (mk_). Use the SECRET key (sk_live_... or sk_test_...).' };
  if (!trimmed.startsWith('sk_test_') && !trimmed.startsWith('sk_live_')) return { valid: false, error: `Invalid format. Key should start with sk_live_ or sk_test_, got: ${trimmed.substring(0, 8)}...` };
  if (trimmed.length < 20) return { valid: false, error: 'Key appears too short. Copy the full key from Stripe Dashboard.' };
  return { valid: true };
}

export function IntegrationSettings({ settings, updateSetting, saveSettings, saving }: IntegrationSettingsProps) {
  const { toast } = useToast();
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [stripeKeyError, setStripeKeyError] = useState<string | undefined>();

  const trackDirty = (section: string, key: string, value: string) => {
    updateSetting(key, value);
    setDirty((prev) => ({ ...prev, [section]: true }));
  };

  const saveAndClearDirty = async (section: string, settingsToSave: Array<{ key: string; value: string; is_sensitive: boolean }>) => {
    await saveSettings(settingsToSave);
    setDirty((prev) => ({ ...prev, [section]: false }));
  };

  const hasMatchingPayPalCredentials = () => {
    const clientId = settings.paypal_client_id?.trim();
    const clientSecret = settings.paypal_client_secret?.trim();

    if (!clientId || !clientSecret || clientSecret === '••••••••') {
      return false;
    }

    return clientId === clientSecret;
  };

  const validatePayPalSettings = () => {
    if (!hasMatchingPayPalCredentials()) {
      return true;
    }

    toast({
      title: 'Invalid PayPal configuration',
      description: 'Client ID and Client Secret cannot be the same. Paste the Secret Key from PayPal into the Client Secret field.',
      variant: 'destructive',
    });

    return false;
  };

  const testConnection = async (type: string) => {
    setTesting((prev) => ({ ...prev, [type]: true }));
    try {
      let endpoint = '';
      let body: Record<string, unknown> = { type: 'test' };
      
      if (type === 'facebook') {
        endpoint = 'facebook-auth-login';
        body = { action: 'test' };
      } else if (type === 'paypal') {
        endpoint = 'paypal-checkout';
        body = { action: 'test' };
      } else if (type === 'esewa') {
        endpoint = 'esewa-checkout';
        body = { action: 'test' };
      } else if (type === 'email') {
        endpoint = 'send-audit-email';
        body = { action: 'test' };
      } else if (type === 'stripe') {
        endpoint = 'check-subscription';
        body = {};
      }

      const { data, error } = await supabase.functions.invoke(endpoint, { body });

      if (error || data?.error) {
        const errorData = data?.error || {};
        toast({
          title: 'Connection Failed',
          description: errorData.human_message || 'Could not connect. Check your configuration.',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Connection Successful', description: `${type} is configured correctly.` });
      }
    } catch (e) {
      toast({ title: 'Test Failed', description: 'An error occurred during the test.', variant: 'destructive' });
    } finally {
      setTesting((prev) => ({ ...prev, [type]: false }));
    }
  };

  const isConfigured = (key: string) => {
    const val = settings[key];
    return !!val && val !== '' && val !== '••••••••';
  };

  return (
    <div className="space-y-6">
      {/* Stripe */}
      <IntegrationCard
        title="Stripe (Payments)"
        icon={<CreditCard className="h-5 w-5 text-[#635BFF]" />}
        isConfigured={isConfigured('stripe_secret_key')}
        onSave={() => {
          const validation = validateStripeSecretKey(settings.stripe_secret_key || '');
          if (!validation.valid) {
            setStripeKeyError(validation.error);
            toast({ title: 'Invalid Stripe Secret Key', description: validation.error, variant: 'destructive' });
            return;
          }
          setStripeKeyError(undefined);
          saveAndClearDirty('stripe', [
            { key: 'stripe_secret_key', value: settings.stripe_secret_key || '', is_sensitive: true },
            { key: 'stripe_publishable_key', value: settings.stripe_publishable_key || '', is_sensitive: false },
          ]);
        }}
        saving={saving}
        onTest={() => testConnection('stripe')}
        testing={testing.stripe}
        dirty={dirty.stripe}
      >
        <div className="p-3 rounded-lg bg-muted/50 text-sm mb-4">
          <p className="text-muted-foreground">
            Get your API keys from{' '}
            <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Stripe Dashboard → API Keys
            </a>
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <SecretInput 
              id="stripe-secret" 
              label="Secret Key" 
              value={settings.stripe_secret_key || ''} 
              onChange={(v) => {
                trackDirty('stripe', 'stripe_secret_key', v);
                const validation = validateStripeSecretKey(v);
                setStripeKeyError(validation.valid ? undefined : validation.error);
              }} 
              placeholder="sk_live_..."
              helpText="Starts with sk_live_ or sk_test_" 
            />
            {stripeKeyError && <p className="text-xs text-destructive mt-1">{stripeKeyError}</p>}
          </div>
          <div className="space-y-2">
            <Label>Publishable Key</Label>
            <Input 
              value={settings.stripe_publishable_key || ''} 
              onChange={(e) => trackDirty('stripe', 'stripe_publishable_key', e.target.value)} 
              placeholder="pk_live_..." 
            />
            <p className="text-xs text-muted-foreground">For client-side Stripe.js (optional)</p>
          </div>
        </div>
      </IntegrationCard>

      {/* Facebook */}
      <IntegrationCard
        title="Facebook API"
        icon={<Facebook className="h-5 w-5 text-[#1877F2]" />}
        isConfigured={isConfigured('facebook_app_id')}
        onSave={() => saveSettings([
          { key: 'facebook_app_id', value: settings.facebook_app_id || '', is_sensitive: false },
          { key: 'facebook_app_secret', value: settings.facebook_app_secret || '', is_sensitive: true },
        ])}
        saving={saving}
        onTest={() => testConnection('facebook')}
        testing={testing.facebook}
      >
        <div className="p-3 rounded-lg bg-muted/50 text-sm mb-4">
          <p className="text-muted-foreground">
            Create an app at{' '}
            <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              developers.facebook.com
            </a>
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>App ID</Label>
            <Input value={settings.facebook_app_id || ''} onChange={(e) => updateSetting('facebook_app_id', e.target.value)} placeholder="Enter Facebook App ID" />
          </div>
          <SecretInput id="fb-secret" label="App Secret" value={settings.facebook_app_secret || ''} onChange={(v) => updateSetting('facebook_app_secret', v)} helpText="From developers.facebook.com" />
        </div>
        <div className="p-3 rounded-lg bg-muted/50 text-sm mt-4">
          <p className="font-medium mb-1">Required Scopes:</p>
          <code className="text-xs">pages_show_list, pages_read_engagement, pages_read_user_content, read_insights, email, public_profile</code>
        </div>
      </IntegrationCard>

      {/* PayPal */}
      <IntegrationCard
        title="PayPal"
        icon={<Wallet className="h-5 w-5 text-[#003087]" />}
        isConfigured={isConfigured('paypal_client_id')}
        onSave={() => {
          if (!validatePayPalSettings()) return;
          void saveAndClearDirty('paypal', [
            { key: 'paypal_client_id', value: settings.paypal_client_id || '', is_sensitive: false },
            { key: 'paypal_client_secret', value: settings.paypal_client_secret || '', is_sensitive: true },
            { key: 'paypal_sandbox_mode', value: settings.paypal_sandbox_mode || 'true', is_sensitive: false },
          ]);
        }}
        saving={saving}
        onTest={() => testConnection('paypal')}
        testing={testing.paypal}
        dirty={dirty.paypal}
      >
        <div className="p-3 rounded-lg bg-muted/50 text-sm mb-4">
          <p className="text-muted-foreground">
            Get credentials from{' '}
            <a href="https://developer.paypal.com/dashboard/applications" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              PayPal Developer Dashboard
            </a>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            <strong>Important:</strong> Use Live credentials with Sandbox OFF, or Sandbox credentials with Sandbox ON.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Client ID</Label>
            <Input value={settings.paypal_client_id || ''} onChange={(e) => trackDirty('paypal', 'paypal_client_id', e.target.value)} placeholder="PayPal Client ID" />
          </div>
          <SecretInput id="paypal-secret" label="Client Secret" value={settings.paypal_client_secret || ''} onChange={(v) => trackDirty('paypal', 'paypal_client_secret', v)} helpText="From developer.paypal.com" />
        </div>
        {hasMatchingPayPalCredentials() && (
          <p className="text-xs text-destructive">
            Client ID and Client Secret cannot be identical. Copy the Secret Key from PayPal into the Client Secret field.
          </p>
        )}
        <div className="flex items-center gap-2 pt-2">
          <Switch checked={settings.paypal_sandbox_mode !== 'false'} onCheckedChange={(v) => trackDirty('paypal', 'paypal_sandbox_mode', String(v))} />
          <Label>Sandbox Mode (Testing)</Label>
        </div>
      </IntegrationCard>

      {/* eSewa */}
      <IntegrationCard
        title="eSewa (Nepal)"
        icon={<Wallet className="h-5 w-5 text-[#60BB46]" />}
        isConfigured={isConfigured('esewa_merchant_id')}
        onSave={() => saveSettings([
          { key: 'esewa_merchant_id', value: settings.esewa_merchant_id || '', is_sensitive: false },
          { key: 'esewa_secret_key', value: settings.esewa_secret_key || '', is_sensitive: true },
          { key: 'esewa_sandbox_mode', value: settings.esewa_sandbox_mode || 'true', is_sensitive: false },
        ])}
        saving={saving}
        onTest={() => testConnection('esewa')}
        testing={testing.esewa}
      >
        <div className="p-3 rounded-lg bg-muted/50 text-sm mb-4">
          <p className="text-muted-foreground">
            Get credentials from{' '}
            <a href="https://merchant.esewa.com.np" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              eSewa Merchant Portal
            </a>
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Merchant ID</Label>
            <Input value={settings.esewa_merchant_id || ''} onChange={(e) => updateSetting('esewa_merchant_id', e.target.value)} placeholder="eSewa Merchant ID" />
          </div>
          <SecretInput id="esewa-secret" label="Secret Key" value={settings.esewa_secret_key || ''} onChange={(v) => updateSetting('esewa_secret_key', v)} helpText="From merchant.esewa.com.np" />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Switch checked={settings.esewa_sandbox_mode !== 'false'} onCheckedChange={(v) => updateSetting('esewa_sandbox_mode', String(v))} />
          <Label>Sandbox Mode (Testing)</Label>
        </div>
      </IntegrationCard>

      {/* Email (Resend) */}
      <IntegrationCard
        title="Email Provider (Resend)"
        icon={<Mail className="h-5 w-5 text-primary" />}
        isConfigured={isConfigured('resend_api_key')}
        onSave={() => saveSettings([
          { key: 'resend_api_key', value: settings.resend_api_key || '', is_sensitive: true },
          { key: 'email_from_address', value: settings.email_from_address || '', is_sensitive: false },
          { key: 'email_from_name', value: settings.email_from_name || '', is_sensitive: false },
        ])}
        saving={saving}
        onTest={() => testConnection('email')}
        testing={testing.email}
      >
        <div className="p-3 rounded-lg bg-muted/50 text-sm mb-4">
          <p className="text-muted-foreground">
            Get your API key from{' '}
            <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Resend Dashboard
            </a>
            . Don't forget to verify your domain!
          </p>
        </div>
        <SecretInput id="resend-key" label="Resend API Key" value={settings.resend_api_key || ''} onChange={(v) => updateSetting('resend_api_key', v)} placeholder="re_..." helpText="From resend.com/api-keys" />
        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <div className="space-y-2">
            <Label>From Email</Label>
            <Input value={settings.email_from_address || ''} onChange={(e) => updateSetting('email_from_address', e.target.value)} placeholder="noreply@yourdomain.com" />
          </div>
          <div className="space-y-2">
            <Label>From Name</Label>
            <Input value={settings.email_from_name || ''} onChange={(e) => updateSetting('email_from_name', e.target.value)} placeholder="Pagelyzer" />
          </div>
        </div>
      </IntegrationCard>

      {/* OpenAI (ChatGPT) */}
      <IntegrationCard
        title="OpenAI (ChatGPT)"
        icon={<Brain className="h-5 w-5 text-[#10A37F]" />}
        isConfigured={isConfigured('openai_api_key')}
        onSave={() => saveSettings([
          { key: 'openai_api_key', value: settings.openai_api_key || '', is_sensitive: true },
        ])}
        saving={saving}
      >
        <div className="p-3 rounded-lg bg-muted/50 text-sm mb-4">
          <p className="text-muted-foreground">
            Get your API key from{' '}
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              OpenAI Platform
            </a>
            . Used for AI-Powered Insights in reports.
          </p>
        </div>
        <SecretInput 
          id="openai-key" 
          label="OpenAI API Key" 
          value={settings.openai_api_key || ''} 
          onChange={(v) => updateSetting('openai_api_key', v)} 
          placeholder="sk-..." 
          helpText="From platform.openai.com/api-keys" 
        />
      </IntegrationCard>
    </div>
  );
}
