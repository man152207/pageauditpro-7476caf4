import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function errorResponse(code: string, message: string, fixSteps: string[], missingKeys?: string[], status = 400) {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        error_code: code,
        human_message: message,
        fix_steps: fixSteps,
        is_config_issue: code.includes('NOT_CONFIGURED'),
        missing_keys: missingKeys,
      }
    }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function getPayPalAccessToken(clientId: string, clientSecret: string, sandbox = true): Promise<string> {
  const baseUrl = sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
  
  const auth = btoa(`${clientId}:${clientSecret}`);
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error_description || 'Failed to get PayPal access token');
  }
  
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  let action = url.searchParams.get("action");
  
  // Clone the request to read body multiple times if needed
  const clonedReq = req.clone();
  let body: Record<string, unknown> = {};
  
  try {
    body = await req.json();
    // If action not in URL, check body
    if (!action && body.action) {
      action = body.action as string;
    }
  } catch {
    // Body might be empty for some actions
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Fetch PayPal credentials from settings (order by updated_at DESC for deterministic reads)
    const { data: settingsData } = await supabaseAdmin
      .from("settings")
      .select("key, value_encrypted")
      .eq("scope", "global")
      .in("key", ["paypal_client_id", "paypal_client_secret", "paypal_sandbox_mode"])
      .order("updated_at", { ascending: false });

    // Deduplicate: take only the first (latest) value per key
    const settingsMap = new Map<string, string>();
    for (const s of settingsData || []) {
      if (!settingsMap.has(s.key)) {
        settingsMap.set(s.key, s.value_encrypted || "");
      }
    }
    const PAYPAL_CLIENT_ID = settingsMap.get("paypal_client_id");
    const PAYPAL_CLIENT_SECRET = settingsMap.get("paypal_client_secret");
    const PAYPAL_SANDBOX = settingsMap.get("paypal_sandbox_mode") !== "false";

    console.log("[PAYPAL] Mode:", PAYPAL_SANDBOX ? "sandbox" : "live", "| Client ID prefix:", PAYPAL_CLIENT_ID?.substring(0, 8));

    // Validate PayPal configuration
    if (!PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID === "••••••••") {
      console.error("[PAYPAL] PayPal Client ID not configured");
      return errorResponse(
        'PAYPAL_NOT_CONFIGURED',
        'PayPal payment gateway is not configured.',
        [
          'Super Admin: Go to Settings → Payment → PayPal',
          'Enter your PayPal Client ID',
          'Get credentials from developer.paypal.com'
        ],
        ['paypal_client_id'],
        500
      );
    }

    if (!PAYPAL_CLIENT_SECRET || PAYPAL_CLIENT_SECRET === "••••••••") {
      console.error("[PAYPAL] PayPal Client Secret not configured");
      return errorResponse(
        'PAYPAL_NOT_CONFIGURED',
        'PayPal payment gateway is not configured.',
        [
          'Super Admin: Go to Settings → Payment → PayPal',
          'Enter your PayPal Client Secret',
          'Get credentials from developer.paypal.com'
        ],
        ['paypal_client_secret'],
        500
      );
    }

    if (PAYPAL_CLIENT_ID === PAYPAL_CLIENT_SECRET) {
      console.error("[PAYPAL] Client ID and Client Secret are identical");
      return errorResponse(
        'INVALID_CREDENTIALS',
        'PayPal Client ID and Client Secret cannot be the same value. Paste the Secret Key from PayPal into the Client Secret field.',
        [
          'Open your PayPal app credentials',
          'Copy the Secret Key, not the Client ID',
          'Save settings before testing the connection'
        ],
        undefined,
        400
      );
    }

    const baseUrl = PAYPAL_SANDBOX ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

    // Action: Test Connection (for Super Admin integration settings)
    if (action === "test") {
      try {
        // Try to get an access token to validate credentials
        const accessToken = await getPayPalAccessToken(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_SANDBOX);
        
        if (accessToken) {
          console.log("[PAYPAL] Connection test successful");
          return new Response(
            JSON.stringify({
              success: true,
              message: 'PayPal credentials are valid.',
              mode: PAYPAL_SANDBOX ? 'sandbox' : 'live',
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error("[PAYPAL] Connection test failed:", errMsg, "| mode:", PAYPAL_SANDBOX ? "sandbox" : "live");
        return errorResponse(
          'INVALID_CREDENTIALS',
          `PayPal credentials are invalid. Current mode: ${PAYPAL_SANDBOX ? 'Sandbox' : 'Live'}. Make sure your credentials match this mode.`,
          [
            `You are in ${PAYPAL_SANDBOX ? 'SANDBOX' : 'LIVE'} mode`,
            'Check your Client ID and Client Secret match this mode',
            'Save settings before testing the connection',
          ],
          undefined,
          400
        );
      }
    }

    // Action: Create Order
    if (action === "create-order" || !action) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return errorResponse('UNAUTHORIZED', 'Please log in to continue.', ['Sign in to your account'], undefined, 401);
      }

      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: authError } = await supabaseClient.auth.getClaims(token);
      if (authError || !claimsData?.claims) {
        console.error("[PAYPAL] Auth error:", authError);
        return errorResponse('UNAUTHORIZED', 'Session expired. Please log in again.', ['Sign in to your account'], undefined, 401);
      }

      const userId = claimsData.claims.sub as string;

      const plan_id = body.plan_id as string;
      const success_url = body.success_url as string | undefined;
      const cancel_url = body.cancel_url as string | undefined;

      if (!plan_id) {
        return errorResponse('INVALID_REQUEST', 'Plan ID is required.', ['Select a plan to continue'], undefined, 400);
      }

      // Fetch plan details
      const { data: plan, error: planError } = await supabaseClient
        .from("plans")
        .select("*")
        .eq("id", plan_id)
        .eq("is_active", true)
        .single();

      if (planError || !plan) {
        return errorResponse('PLAN_NOT_FOUND', 'The selected plan is not available.', ['Select a different plan'], undefined, 404);
      }

      if (plan.price <= 0) {
        return errorResponse('INVALID_PLAN', 'Cannot checkout free plan.', ['Upgrade to a paid plan'], undefined, 400);
      }

      // Get PayPal access token
      const accessToken = await getPayPalAccessToken(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_SANDBOX);

      // For PayPal, always use the production domain that's registered in PayPal
      // This avoids issues with dynamic preview domains not being whitelisted
      const PRODUCTION_DOMAIN = "https://pagelyzer.io";
      
      // Check if success_url starts with production domain, otherwise use production
      const getWhitelistedOrigin = (url?: string): string => {
        if (url && url.startsWith(PRODUCTION_DOMAIN)) {
          return PRODUCTION_DOMAIN;
        }
        return PRODUCTION_DOMAIN; // Always use production domain
      };
      
      const origin = getWhitelistedOrigin(success_url);

      // Create PayPal order
      const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: plan_id,
            description: plan.name,
            custom_id: `${userId}|${plan_id}`,
            amount: {
              currency_code: plan.currency.toUpperCase(),
              value: plan.price.toFixed(2),
            },
          }],
          application_context: {
            brand_name: 'Pagelyzer',
            landing_page: 'LOGIN',
            user_action: 'PAY_NOW',
            return_url: success_url || `${origin}/dashboard?payment=success&gateway=paypal`,
            cancel_url: cancel_url || `${origin}/pricing?payment=cancelled`,
          },
        }),
      });

      const orderData = await orderResponse.json();

      if (orderData.error) {
        console.error("[PAYPAL] Create order error:", orderData);
        return errorResponse(
          'PAYMENT_FAILED',
          'Failed to create PayPal order.',
          ['Try again', 'If the issue persists, use a different payment method'],
          undefined,
          500
        );
      }

      const approvalUrl = orderData.links?.find((link: { rel: string }) => link.rel === 'approve')?.href;

      console.log("[PAYPAL] Order created:", orderData.id);

      return new Response(
        JSON.stringify({
          success: true,
          orderId: orderData.id,
          approvalUrl,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: Capture Order (after user approves)
    if (action === "capture-order") {
      const order_id = body.order_id as string;

      if (!order_id) {
        return errorResponse('INVALID_REQUEST', 'Order ID is required.', ['Complete the payment flow again'], undefined, 400);
      }

      const accessToken = await getPayPalAccessToken(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_SANDBOX);

      const captureResponse = await fetch(`${baseUrl}/v2/checkout/orders/${order_id}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const captureData = await captureResponse.json();

      if (captureData.error || captureData.status !== 'COMPLETED') {
        console.error("[PAYPAL] Capture error:", captureData);
        return errorResponse(
          'PAYMENT_FAILED',
          'Payment could not be completed.',
          ['Check your PayPal account balance', 'Try a different payment method'],
          undefined,
          400
        );
      }

      // Extract user and plan info
      const customId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id || 
                       captureData.purchase_units?.[0]?.custom_id;
      
      if (!customId) {
        console.error("[PAYPAL] Missing custom_id in capture response");
        return errorResponse('PAYMENT_FAILED', 'Payment verification failed.', ['Contact support'], undefined, 500);
      }

      const [userId, planId] = customId.split('|');

      // Record payment
      const captureInfo = captureData.purchase_units?.[0]?.payments?.captures?.[0];
      const { error: paymentError } = await supabaseAdmin
        .from("payments")
        .insert({
          user_id: userId,
          plan_id: planId,
          amount: parseFloat(captureInfo?.amount?.value || '0'),
          currency: captureInfo?.amount?.currency_code || 'USD',
          status: "completed",
          gateway: "paypal",
          gateway_payment_id: captureInfo?.id || order_id,
          gateway_response: captureData,
        });

      if (paymentError) {
        console.error("[PAYPAL] Error recording payment:", paymentError);
      }

      // Create subscription
      const { error: subError } = await supabaseAdmin
        .from("subscriptions")
        .insert({
          user_id: userId,
          plan_id: planId,
          status: "active",
          started_at: new Date().toISOString(),
          gateway: "paypal",
          gateway_subscription_id: order_id,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (subError) {
        console.error("[PAYPAL] Error creating subscription:", subError);
      }

      console.log("[PAYPAL] Payment captured and subscription created for user:", userId);

      return new Response(
        JSON.stringify({
          success: true,
          paymentId: captureInfo?.id,
          status: 'completed',
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return errorResponse('INVALID_ACTION', 'Invalid action specified.', ['Contact support'], undefined, 400);
  } catch (error: unknown) {
    console.error("[PAYPAL] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return errorResponse(
      'UNKNOWN_ERROR',
      'An unexpected error occurred with PayPal.',
      ['Please try again', 'If the issue persists, contact support'],
      undefined,
      500
    );
  }
});
