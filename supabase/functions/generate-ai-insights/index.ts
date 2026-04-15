import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-AI-INSIGHTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

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

    const { audit_id } = await req.json();

    if (!audit_id) {
      return new Response(
        JSON.stringify({ error: "audit_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch audit with metrics
    const { data: audit, error: auditError } = await supabase
      .from("audits")
      .select("*, audit_metrics(*)")
      .eq("id", audit_id)
      .eq("user_id", userId)
      .single();

    if (auditError || !audit) {
      logStep("Audit not found", { audit_id, error: auditError?.message });
      return new Response(
        JSON.stringify({ error: "Audit not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check Pro access
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*, plan:plans(*)")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    const isPro = !!subscription && subscription.plan?.billing_type !== "free";

    // Check for free audit grant
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthStr = startOfMonth.toISOString().split('T')[0];

    const { data: freeGrant } = await supabase
      .from("free_audit_grants")
      .select("id")
      .eq("user_id", userId)
      .eq("grant_month", monthStr)
      .maybeSingle();

    const hasProAccess = isPro || !!freeGrant || audit.is_pro_unlocked;

    if (!hasProAccess) {
      return new Response(
        JSON.stringify({ error: "Pro subscription required for AI insights" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Pro access verified");

    // Build context for AI
    const inputData = audit.input_data || {};
    const scoreBreakdown = audit.score_breakdown || {};
    const metrics = audit.audit_metrics?.[0]?.computed_metrics || {};
    const recommendations = audit.recommendations || [];

    const prompt = `You are an expert Facebook marketing consultant. Analyze this Facebook page's performance data and provide 5 actionable insights to improve engagement and growth.

## Page Data
- Page Name: ${audit.page_name || "Facebook Page"}
- Overall Score: ${audit.score_total}/100
- Engagement Score: ${scoreBreakdown.engagement || 0}/100
- Consistency Score: ${scoreBreakdown.consistency || 0}/100
- Readiness Score: ${scoreBreakdown.readiness || 0}/100

## Metrics
- Followers: ${inputData.followers?.toLocaleString() || "Unknown"}
- Posts Analyzed: ${inputData.postsAnalyzed || 0}
- Posts Per Week: ${inputData.postsPerWeek || metrics.postsPerWeek || 0}
- Engagement Rate: ${metrics.engagementRate || 0}%
- Total Likes: ${inputData.totalLikes || 0}
- Total Comments: ${inputData.totalComments || 0}
- Total Shares: ${inputData.totalShares || 0}

## Current Recommendations Already Provided
${recommendations.map((r: any) => `- ${r.title}: ${r.description}`).join('\n')}

## Instructions
Provide exactly 5 strategic insights that go beyond the basic recommendations. Focus on:
1. Content strategy improvements specific to their engagement patterns
2. Optimal posting timing based on their consistency score
3. Audience growth tactics
4. Engagement boosting techniques
5. One "quick win" they can implement today

Format each insight with a clear title and 2-3 sentences of actionable advice. Be specific and actionable.`;

    // Fetch OpenAI API key from settings
    const { data: apiKeySetting } = await supabase
      .from("settings")
      .select("value_encrypted")
      .eq("scope", "global")
      .eq("key", "openai_api_key")
      .maybeSingle();

    const openaiApiKey = apiKeySetting?.value_encrypted;

    if (!openaiApiKey || openaiApiKey === '••••••••') {
      logStep("OpenAI API key not configured");
      return new Response(
        JSON.stringify({ 
          error: "OpenAI API key not configured",
          is_config_issue: true,
          fix_steps: ["Go to Super Admin → Settings → Integrations", "Add your OpenAI API key"]
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Calling OpenAI API (ChatGPT)");

    // Call OpenAI API
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a Facebook marketing expert providing personalized insights. Be specific, actionable, and data-driven. Format your response with clear section headers using ## for each insight title.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logStep("AI API error", { status: aiResponse.status, error: errorText });
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const insights = aiData.choices?.[0]?.message?.content;

    if (!insights) {
      throw new Error("No insights generated from AI");
    }

    logStep("AI insights generated", { length: insights.length });

    // Store insights in audit_metrics
    const { error: updateError } = await supabase
      .from("audit_metrics")
      .update({ ai_insights: insights })
      .eq("audit_id", audit_id);

    if (updateError) {
      logStep("Failed to store insights", { error: updateError.message });
      // Continue anyway - we can still return the insights
    }

    logStep("Insights stored successfully");

    return new Response(
      JSON.stringify({
        success: true,
        insights,
      }),
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
