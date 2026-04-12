import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Audit {
  id: string;
  user_id: string;
  fb_connection_id: string | null;
  audit_type: 'manual' | 'automatic';
  page_name: string | null;
  page_url: string | null;
  score_total: number | null;
  score_breakdown: Record<string, number> | null;
  recommendations: any[] | null;
  is_pro_unlocked: boolean;
  created_at: string;
}

export interface AuditStats {
  totalAudits: number;
  avgScore: number;
  auditsThisMonth: number;
  lastAuditDate: string | null;
}

// Fetch user's recent audits
export function useRecentAudits(limit = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['audits', 'recent', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Audit[];
    },
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minute
  });
}

// Fetch a single audit
export function useAudit(auditId: string | undefined) {
  const { user, session } = useAuth();

  return useQuery({
    queryKey: ['audit', auditId],
    queryFn: async () => {
      if (!auditId || !session) return null;

      // Call edge function with query param for gated report data
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-audit-report?audit_id=${auditId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch audit');
      }

      return await response.json();
    },
    enabled: !!auditId && !!user && !!session,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Fetch aggregate audit stats
export function useAuditStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['audits', 'stats', user?.id],
    queryFn: async (): Promise<AuditStats> => {
      if (!user) {
        return {
          totalAudits: 0,
          avgScore: 0,
          auditsThisMonth: 0,
          lastAuditDate: null,
        };
      }

      // Total audits
      const { count: totalAudits } = await supabase
        .from('audits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Average score
      const { data: scoreData } = await supabase
        .from('audits')
        .select('score_total')
        .eq('user_id', user.id)
        .not('score_total', 'is', null);

      const avgScore = scoreData?.length
        ? Math.round(scoreData.reduce((acc, a) => acc + (a.score_total || 0), 0) / scoreData.length)
        : 0;

      // Audits this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: auditsThisMonth } = await supabase
        .from('audits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      // Last audit date
      const { data: lastAudit } = await supabase
        .from('audits')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        totalAudits: totalAudits || 0,
        avgScore,
        auditsThisMonth: auditsThisMonth || 0,
        lastAuditDate: lastAudit?.created_at || null,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minute
  });
}

// Run a new audit
export interface RunAuditParams {
  connectionId: string;
  dateRange?: {
    preset?: string;
    from?: string;
    to?: string;
  };
}

export function useRunAudit() {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RunAuditParams | string) => {
      if (!session) throw new Error('Not authenticated');

      // Support both legacy string (connection_id) and new object format
      const connectionId = typeof params === 'string' ? params : params.connectionId;
      const dateRange = typeof params === 'string' ? undefined : params.dateRange;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-audit`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            connection_id: connectionId,
            date_range: dateRange,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        const err = new Error(errData.human_message || errData.error || 'Failed to run audit');
        (err as any).code = errData.error;
        (err as any).fix_steps = errData.fix_steps;
        throw err;
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Audit Complete!',
        description: `Your page scored ${data.scores.overall}/100`,
      });
      queryClient.invalidateQueries({ queryKey: ['audits'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Audit Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
