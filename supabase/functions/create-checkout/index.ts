import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error("Supabase configuration missing");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client to fetch settings
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch Stripe secret key from settings first, fallback to env
    const { data: stripeKeyData } = await supabaseAdmin
      .from("settings")
      .select("value_encrypted")
      .eq("scope", "global")
      .eq("key", "stripe_secret_key")
      .maybeSingle();

    const stripeSecretKey = stripeKeyData?.value_encrypted || Deno.env.get("STRIPE_SECRET_KEY");
    
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ 
          error: {
            error_code: "STRIPE_NOT_CONFIGURED",
            human_message: "Payment service is not configured",
            fix_steps: ["Go to Super Admin Settings → Integrations", "Add your Stripe Secret Key"],
            is_config_issue: true,
            missing_keys: ["stripe_secret_key"]
          }
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email;

    const { plan_id, success_url, cancel_url } = await req.json();

    if (!plan_id) {
      return new Response(
        JSON.stringify({ error: "plan_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch plan details
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("id", plan_id)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: "Plan not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (plan.price <= 0) {
      return new Response(
        JSON.stringify({ error: "Cannot checkout free plan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate key format before using
    if (!stripeSecretKey.startsWith("sk_live_") && !stripeSecretKey.startsWith("sk_test_")) {
      const prefix = stripeSecretKey.substring(0, Math.min(8, stripeSecretKey.length));
      console.error(`Invalid Stripe secret key format. Got prefix: ${prefix}...`);
      return new Response(
        JSON.stringify({
          error: {
            error_code: "STRIPE_INVALID_KEY_FORMAT",
            human_message: `The stored Stripe key has an invalid format (starts with "${prefix}..."). It must start with sk_live_ or sk_test_.`,
            fix_steps: [
              "Go to Super Admin Settings → Integrations",
              "Replace the Stripe Secret Key with the correct key from dashboard.stripe.com/apikeys (starts with sk_live_ or sk_test_)",
            ],
            is_config_issue: true,
            missing_keys: ["stripe_secret_key"],
          },
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-08-27.basil" });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    let customerId = customers.data[0]?.id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;
    }

    // Determine checkout mode
    const isSubscription = plan.billing_type === "monthly" || plan.billing_type === "yearly";

    // Use origin from request or fallback to production domain
    const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/$/, '') || "https://pagelyzer.io";

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: plan.currency.toLowerCase(),
            product_data: {
              name: plan.name,
              description: plan.description || undefined,
            },
            unit_amount: Math.round(plan.price * 100),
            ...(isSubscription && {
              recurring: {
                interval: plan.billing_type === "yearly" ? "year" : "month",
              },
            }),
          },
          quantity: 1,
        },
      ],
      mode: isSubscription ? "subscription" : "payment",
      success_url: success_url || `${origin}/dashboard?payment=success`,
      cancel_url: cancel_url || `${origin}/pricing?payment=cancelled`,
      metadata: {
        supabase_user_id: userId,
        plan_id: plan_id,
        plan_name: plan.name,
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log("Checkout session created:", session.id, "URL:", session.url);

    return new Response(
      JSON.stringify({ 
        sessionId: session.id, 
        url: session.url 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error creating checkout session:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
