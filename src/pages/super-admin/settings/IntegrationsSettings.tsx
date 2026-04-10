import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { IntegrationSettings } from '@/components/settings/IntegrationSettings';
import { Loader2 } from 'lucide-react';

export default function IntegrationsSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<Record<string, string>>({
    facebook_app_id: '',
    facebook_app_secret: '',
    stripe_secret_key: '',
    stripe_publishable_key: '',
    stripe_webhook_secret: '',
    paypal_client_id: '',
    paypal_client_secret: '',
    paypal_sandbox_mode: 'true',
    esewa_merchant_id: '',
    esewa_secret_key: '',
    esewa_sandbox_mode: 'true',
    resend_api_key: '',
    email_from_address: '',
    email_from_name: '',
    openai_api_key: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value_encrypted, is_sensitive')
        .eq('scope', 'global')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const newSettings = { ...settings };
        const seen = new Set<string>();
        data.forEach((item) => {
          const key = item.key as keyof typeof settings;
          // Skip duplicates — first row is latest due to ORDER BY
          if (seen.has(key)) return;
          seen.add(key);
          if (key in newSettings) {
            if (item.is_sensitive && item.value_encrypted) {
              newSettings[key] = '••••••••';
            } else {
              newSettings[key] = item.value_encrypted || '';
            }
          }
        });
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async (settingsToSave: { key: string; value: string; is_sensitive: boolean }[]) => {
    setSaving(true);
    
    try {
      for (const setting of settingsToSave) {
        if (setting.is_sensitive && setting.value === '••••••••') {
          continue;
        }

        // Delete existing then insert to avoid NULL upsert issues
        await supabase
          .from('settings')
          .delete()
          .eq('scope', 'global')
          .is('scope_id', null)
          .eq('key', setting.key);

        const { error } = await supabase
          .from('settings')
          .insert({
            scope: 'global',
            scope_id: null,
            key: setting.key,
            value_encrypted: setting.value,
            is_sensitive: setting.is_sensitive,
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <IntegrationSettings
      settings={settings}
      updateSetting={updateSetting}
      saveSettings={saveSettings}
      saving={saving}
    />
  );
}
