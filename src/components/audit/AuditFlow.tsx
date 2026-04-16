import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRunAudit } from '@/hooks/useAudits';
import { useSubscription } from '@/hooks/useSubscription';
import { ConnectedPagesList } from './ConnectedPagesList';
import { BasicReportPreview } from './BasicReportPreview';
import { AuditProgress, AuditStep } from './AuditProgress';
import { DateRangeSelector, DateRangePreset } from './DateRangeSelector';
import {
  Facebook,
  Loader2,
  Plus,
} from 'lucide-react';
import { subDays } from 'date-fns';

interface FBConnection {
  id: string;
  page_id: string;
  page_name: string;
  is_active: boolean;
  connected_at: string;
  token_expires_at?: string | null;
}

interface AuditResult {
  auditId: string;
  pageName: string;
  score: number;
  breakdown: { engagement: number; consistency: number; readiness: number; growth?: number };
  recommendations: any[];
  createdAt?: string;
  inputData?: any;
  metrics?: any;
}

interface DateRange {
  from: Date;
  to: Date;
}

interface AuditFlowProps {
  onComplete?: (auditId: string) => void;
}

export function AuditFlow({ onComplete }: AuditFlowProps) {
  const { user, session, subscription } = useAuth();
  const { toast } = useToast();
  const { isPro, usage, hasReachedLimit } = useSubscription();
  const runAudit = useRunAudit();

  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connections, setConnections] = useState<FBConnection[]>([]);
  const [runningAuditId, setRunningAuditId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [lastAuditResult, setLastAuditResult] = useState<AuditResult | null>(null);
  
  // Date range state
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>('30d');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  useEffect(() => {
    if (user) {
      fetchConnections();
    }

    // Listen for OAuth callback
    const handleMessage = (event: MessageEvent) => {
      // Accept both legacy + current callback event names
      if (event.data.type === 'fb-oauth-success' || event.data.type === 'fb-page-success') {
        setConnecting(false);
        handleOAuthSuccess(event.data.pages);
      } else if (event.data.type === 'fb-oauth-error' || event.data.type === 'fb-page-error') {
        setConnecting(false);
        toast({
          title: 'Connection Failed',
          description: event.data.error,
          variant: 'destructive',
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user]);

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('fb_connections')
        .select('id, page_id, page_name, is_active, connected_at, token_expires_at')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('connected_at', { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    
    try {
      const response = await fetch(
        `/api/facebook-oauth.php?action=get-auth-url`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Open popup for OAuth
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(
        result.authUrl,
        'facebook-oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (error: any) {
      setConnecting(false);
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to start Facebook connection',
        variant: 'destructive',
      });
    }
  };

  const handleOAuthSuccess = async (pages: any[]) => {
    if (pages.length === 0) {
      toast({
        title: 'No Pages Found',
        description: 'Make sure you have admin access to at least one Facebook page.',
        variant: 'destructive',
      });
      return;
    }

    // Save the first page (or all pages if we implement multi-select later)
    await saveAndSelectPage(pages[0]);
  };

  const saveAndSelectPage = async (page: any) => {
    try {
      const response = await fetch(
        `/api/facebook-oauth.php?action=save-connection`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            page_id: page.id,
            page_name: page.name,
            access_token: page.access_token,
          }),
        }
      );

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: 'Page Connected!',
        description: `${page.name} is now connected.`,
      });

      // Refresh connections list (don't auto-run audit)
      await fetchConnections();
    } catch (error: any) {
      toast({
        title: 'Failed to Save',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRunAudit = async (connection: FBConnection) => {
    // Check usage limits for free users
    if (!isPro && hasReachedLimit('audits')) {
      toast({
        title: 'Audit Limit Reached',
        description: `You've used all ${usage.auditsLimit} audits this month. Upgrade to Pro for unlimited audits.`,
        variant: 'destructive',
      });
      return;
    }

    setRunningAuditId(connection.id);
    setLastAuditResult(null);

    try {
      // Pass date range to the audit
      const result = await runAudit.mutateAsync({
        connectionId: connection.id,
        dateRange: {
          preset: selectedPreset,
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString(),
        },
      });
      
      // Store result for inline preview
      setLastAuditResult({
        auditId: result.audit_id,
        pageName: connection.page_name,
        score: result.scores?.overall || 0,
        breakdown: {
          engagement: result.scores?.engagement || 0,
          consistency: result.scores?.consistency || 0,
          readiness: result.scores?.readiness || 0,
          growth: result.scores?.growth,
        },
        recommendations: [],
        createdAt: new Date().toISOString(),
        inputData: result.input_data || result.inputData,
        metrics: result.metrics,
      });

      // Fetch recommendations and metrics from the created audit
      const [auditRes, metricsRes] = await Promise.all([
        supabase
          .from('audits')
          .select('recommendations, input_data, created_at, score_breakdown')
          .eq('id', result.audit_id)
          .single(),
        supabase
          .from('audit_metrics')
          .select('computed_metrics, raw_metrics')
          .eq('audit_id', result.audit_id)
          .single(),
      ]);

      setLastAuditResult(prev => prev ? {
        ...prev,
        recommendations: (auditRes.data?.recommendations as any[]) || [],
        createdAt: auditRes.data?.created_at || prev.createdAt,
        inputData: prev.inputData || auditRes.data?.input_data,
        metrics: metricsRes.data?.computed_metrics || metricsRes.data?.raw_metrics || prev.metrics,
      } : null);

      onComplete?.(result.audit_id);
    } catch (error: any) {
      if (error?.code === 'token_expired') {
        // Refresh connections to show expired status
        await fetchConnections();
        toast({
          title: 'Connection Expired',
          description: 'Your Facebook token has expired. Please reconnect your page.',
          variant: 'destructive',
        });
      }
    } finally {
      setRunningAuditId(null);
    }
  };

  const handleDisconnect = async (connection: FBConnection) => {
    setDisconnectingId(connection.id);

    try {
      const { error } = await supabase
        .from('fb_connections')
        .update({ is_active: false })
        .eq('id', connection.id);

      if (error) throw error;

      toast({
        title: 'Page Disconnected',
        description: `${connection.page_name} has been disconnected.`,
      });

      await fetchConnections();
    } catch (error: any) {
      toast({
        title: 'Failed to Disconnect',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDisconnectingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Running state with premium progress UI
  if (runningAuditId) {
    const runningConnection = connections.find(c => c.id === runningAuditId);
    return (
      <div className="space-y-8">
        {/* Show pages list in background (dimmed) */}
        <div className="opacity-50 pointer-events-none">
          <ConnectedPagesList
            connections={connections}
            onRunAudit={handleRunAudit}
            onDisconnect={handleDisconnect}
            onReconnect={handleConnect}
            runningAuditId={runningAuditId}
            disconnectingId={disconnectingId}
          />
        </div>

        {/* Premium progress panel */}
        <AuditProgress 
          currentStep="fetching" 
          pageName={runningConnection?.page_name}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Usage info for free users */}
      {!isPro && !subscription?.hasFreeAuditGrant && (
        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
          <p>
            <strong>Free Plan:</strong> {usage.auditsRemaining} of {usage.auditsLimit} audits remaining this month
          </p>
        </div>
      )}
      {subscription?.hasFreeAuditGrant && !isPro && (
        <div className="bg-success/10 rounded-lg p-4 text-sm text-success">
          <p>
            <strong>🎁 Free Audit Grant:</strong> Unlimited audits this month
          </p>
        </div>
      )}

      {/* Connected Pages Section */}
      {connections.length > 0 ? (
        <div className="space-y-6">
          {/* Date Range Selector - Prominent position */}
          <div className="p-5 rounded-2xl border border-border bg-card">
            <DateRangeSelector
              selectedPreset={selectedPreset}
              dateRange={dateRange}
              onPresetChange={setSelectedPreset}
              onDateRangeChange={setDateRange}
              showBackendNote={true}
            />
          </div>

          {/* Pages list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Connected Pages</h3>
              <Button variant="outline" size="sm" onClick={handleConnect} disabled={connecting}>
                {connecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Connect Another Page
              </Button>
            </div>

            <ConnectedPagesList
              connections={connections}
              onRunAudit={handleRunAudit}
              onDisconnect={handleDisconnect}
              onReconnect={handleConnect}
              runningAuditId={runningAuditId}
              disconnectingId={disconnectingId}
            />
          </div>
        </div>
      ) : (
        /* No connections - Show connect CTA */
        <div className="max-w-md mx-auto text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1877F2]/10 mx-auto mb-6">
            <Facebook className="h-10 w-10 text-[#1877F2]" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Connect Your Facebook Page</h2>
          <p className="text-muted-foreground mb-6">
            Connect your Facebook page to automatically analyze your engagement, 
            content performance, and get personalized recommendations.
          </p>

          <Button
            onClick={handleConnect}
            disabled={connecting}
            size="lg"
            className="w-full bg-[#1877F2] hover:bg-[#166fe5]"
          >
            {connecting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Facebook className="mr-2 h-5 w-5" />
                Connect with Facebook
              </>
            )}
          </Button>
        </div>
      )}

      {/* Basic Report Preview - Shows after audit completes */}
      {lastAuditResult && (
        <div className="pt-4 border-t border-border">
          <BasicReportPreview
            auditId={lastAuditResult.auditId}
            pageName={lastAuditResult.pageName}
            score={lastAuditResult.score}
            breakdown={lastAuditResult.breakdown}
            recommendations={lastAuditResult.recommendations}
            createdAt={lastAuditResult.createdAt}
            inputData={lastAuditResult.inputData}
            metrics={lastAuditResult.metrics}
          />
        </div>
      )}
    </div>
  );
}
