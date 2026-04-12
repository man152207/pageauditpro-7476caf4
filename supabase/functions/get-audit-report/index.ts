import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-AUDIT-REPORT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const url = new URL(req.url);
    const auditId = url.searchParams.get("audit_id");

    if (!auditId) {
      return new Response(
        JSON.stringify({ error: "audit_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    
    if (authError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.claims.sub;
    logStep("User authenticated", { userId });

    // Fetch the audit
    const { data: audit, error: auditError } = await supabase
      .from("audits")
      .select("*")
      .eq("id", auditId)
      .eq("user_id", userId)
      .single();

    if (auditError || !audit) {
      logStep("Audit not found", { auditId, error: auditError?.message });
      return new Response(
        JSON.stringify({ error: "Audit not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Audit found", { auditId, pageName: audit.page_name });

    // Check subscription status
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*, plan:plans(*)")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    const isPro = !!subscription && subscription.plan?.billing_type !== "free";
    logStep("Subscription check", { isPro, auditIsProUnlocked: audit.is_pro_unlocked });

    // Check for free audit grant for this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthStr = startOfMonth.toISOString().split('T')[0];

    const { data: freeGrants } = await supabase
      .from("free_audit_grants")
      .select("id, grant_month")
      .eq("user_id", userId)
      .or(`grant_month.eq.${monthStr},grant_month.eq.9999-01-01`);

    const hasFreeAuditGrant = !!(freeGrants && freeGrants.length > 0);
    logStep("Free audit grant check", { hasFreeAuditGrant, month: monthStr });

    // User has Pro access if: currently subscribed OR this specific audit was unlocked OR has free grant
    const hasProAccess = isPro || audit.is_pro_unlocked || hasFreeAuditGrant;

    // Prepare base response (available to all users)
    const baseResponse: any = {
      id: audit.id,
      page_name: audit.page_name,
      page_url: audit.page_url,
      audit_type: audit.audit_type,
      created_at: audit.created_at,
      score_total: audit.score_total,
      score_breakdown: audit.score_breakdown,
      is_pro_unlocked: hasProAccess,
      has_pro_access: hasProAccess,
    };

    // FREE tier: Basic metrics visible + Pro-only sections locked
    if (!hasProAccess) {
      logStep("Returning FREE tier data with basic metrics");

      // Only return first 2 recommendations for free users
      const allRecommendations = (audit.recommendations as any[]) || [];
      const freeRecommendations = allRecommendations
        .filter((r: any) => !r.isPro)
        .slice(0, 2);

      // Fetch metrics (now stored for ALL users)
      const { data: metrics } = await supabase
        .from("audit_metrics")
        .select("computed_metrics, data_availability")
        .eq("audit_id", auditId)
        .maybeSingle();

      const computed = (metrics?.computed_metrics as any) || {};
      
      // Return basic metrics so free users see real data
      const basicMetrics = {
        followers: computed.followers || (audit.input_data as any)?.followers || 0,
        engagementRate: computed.engagementRate || null,
        avgEngagementPerPost: computed.avgEngagementPerPost || null,
        postsCount: computed.postsCount || (audit.input_data as any)?.postsAnalyzed || 0,
        postsPerWeek: computed.postsPerWeek || null,
        totalLikes: computed.totalLikes || 0,
        totalComments: computed.totalComments || 0,
        totalShares: computed.totalShares || 0,
        totalEngagements: computed.totalEngagements || 0,
      };

      return new Response(
        JSON.stringify({
          ...baseResponse,
          recommendations: freeRecommendations,
          input_data: audit.input_data,
          detailed_metrics: basicMetrics,
          data_availability: metrics?.data_availability || null,
          // Pro-only fields NOT included
          // No raw_metrics, posts_analysis, demographics, ai_insights
          locked_sections: [
            "posts_analysis",
            "demographics",
            "ai_insights",
            "pdf_export",
            "share_link",
            "trend_data",
            "best_time_to_post",
          ],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PRO tier: Full data
    logStep("Returning PRO tier data");

    // Fetch detailed metrics
    const { data: metrics } = await supabase
      .from("audit_metrics")
      .select("*")
      .eq("audit_id", auditId)
      .maybeSingle();

    // Fetch report for share info
    const { data: report } = await supabase
      .from("reports")
      .select("*")
      .eq("audit_id", auditId)
      .maybeSingle();

    const proResponse = {
      ...baseResponse,
      recommendations: audit.recommendations || [],
      input_data: audit.input_data,
      detailed_metrics: metrics?.computed_metrics || null,
      raw_metrics: metrics?.raw_metrics || null,
      data_availability: metrics?.data_availability || null,
      ai_insights: metrics?.ai_insights || null,
      demographics: metrics?.demographics || null,
      report: report ? {
        id: report.id,
        is_public: report.is_public,
        share_slug: report.share_slug,
        pdf_url: report.pdf_url,
        views_count: report.views_count,
      } : null,
      locked_sections: [], // Nothing locked for Pro users
    };

    return new Response(
      JSON.stringify(proResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
