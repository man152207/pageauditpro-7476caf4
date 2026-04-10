import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Validate environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      logStep("Missing environment variables", { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!serviceRoleKey 
      });
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      logStep("No auth header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, { 
      auth: { persistSession: false } 
    });

    const token = authHeader.replace("Bearer ", "");
    
    // Validate JWT using getUser with token (required for Lovable Cloud ES256 signing)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      logStep("Auth error", { error: authError?.message });
      return new Response(
        JSON.stringify({ error: "Session expired", code: "AUTH_ERROR" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const userId = user.id;
    logStep("User authenticated", { userId });

    // Fetch active subscription with plan details
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select(`
        *,
        plan:plans(*)
      `)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (subError) {
      logStep("Subscription query error", { error: subError.message });
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscription" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has an active subscription
    const hasActiveSubscription = !!subscription;
    const plan = subscription?.plan;
    
    logStep("Subscription status", { 
      hasActiveSubscription, 
      planName: plan?.name || "Free",
      planId: plan?.id || null 
    });

    // Check if super_admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "super_admin")
      .maybeSingle();
    const isSuperAdmin = !!roleData;

    // Determine if user is Pro (any paid plan or super_admin)
    const isPro = isSuperAdmin || (hasActiveSubscription && plan?.billing_type !== "free");

    // Get plan features and limits
    const featureFlags = (plan?.feature_flags as Record<string, boolean>) || {};
    const limits = (plan?.limits as Record<string, number>) || {
      audits_per_month: 3,
      pdf_exports: 0,
      history_days: 7,
    };

    // Calculate usage this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: auditsThisMonth } = await supabase
      .from("audits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    // Check for free audit grant for this month
    const monthStr = startOfMonth.toISOString().split('T')[0];

    const { data: freeGrants } = await supabase
      .from("free_audit_grants")
      .select("id, grant_month")
      .eq("user_id", userId)
      .or(`grant_month.eq.${monthStr},grant_month.eq.9999-01-01`);

    const hasFreeAuditGrant = !!(freeGrants && freeGrants.length > 0);
    const hasLifetimeGrant = !!(freeGrants && freeGrants.some((g: any) => g.grant_month === '9999-01-01'));
    logStep("Free audit grant check", { hasFreeAuditGrant, hasLifetimeGrant, month: monthStr });

    // For users with free audit grants, show unlimited audits
    const usageStats = hasFreeAuditGrant ? {
      auditsUsed: auditsThisMonth || 0,
      auditsLimit: 999999,
      auditsRemaining: 999999,
    } : {
      auditsUsed: auditsThisMonth || 0,
      auditsLimit: limits.audits_per_month || 3,
      auditsRemaining: Math.max(0, (limits.audits_per_month || 3) - (auditsThisMonth || 0)),
    };

    logStep("Usage stats", usageStats);

    // For users with free grants, give them Pro-like features
    const hasProAccess = isPro || hasFreeAuditGrant;

    const response = {
      subscribed: hasActiveSubscription,
      isPro,
      hasFreeAuditGrant,
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        started_at: subscription.started_at,
        expires_at: subscription.expires_at,
        renews_at: subscription.renews_at,
      } : null,
      plan: plan ? {
        id: plan.id,
        name: plan.name,
        billing_type: plan.billing_type,
        price: plan.price,
        currency: plan.currency,
      } : {
        id: null,
        name: "Free",
        billing_type: "free",
        price: 0,
        currency: "USD",
      },
      features: {
        canAutoAudit: hasProAccess || featureFlags.auto_audit === true,
        canExportPdf: hasProAccess || featureFlags.pdf_export === true,
        canShareReport: hasProAccess || featureFlags.share_report === true,
        canViewFullMetrics: hasProAccess || featureFlags.full_metrics === true,
        canViewDemographics: hasProAccess || featureFlags.demographics === true,
        canViewAIInsights: hasProAccess || featureFlags.ai_insights === true,
      },
      limits,
      usage: usageStats,
    };

    logStep("Response prepared", { isPro, hasFreeAuditGrant, planName: response.plan.name });

    return new Response(
      JSON.stringify(response),
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
