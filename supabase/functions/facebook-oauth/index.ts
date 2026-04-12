import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { encryptToken, decryptToken } from "../_shared/token-encryption.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fixed production redirect URI (must match Facebook console exactly)
const PRODUCTION_REDIRECT_URI = "https://pagelyzer.io/api/auth/facebook/page/callback";

// Helper to create structured error response
function errorResponse(code: string, message: string, fixSteps: string[], status = 400) {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        error_code: code,
        human_message: message,
        fix_steps: fixSteps,
        is_config_issue: code.includes('NOT_CONFIGURED'),
      }
    }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ALWAYS use production domain for OAuth redirects per project requirements
  const PRODUCTION_ORIGIN = "https://pagelyzer.io";
  const defaultRedirectUri = `${PRODUCTION_ORIGIN}/api/auth/facebook/page/callback`;

  const queryAction = url.searchParams.get("action");

  // Parse JSON body once (avoid reading req.json() multiple times)
  let bodyData: Record<string, unknown> = {};
  if (req.method === "POST") {
    try {
      bodyData = await req.json();
    } catch {
      bodyData = {};
    }
  }

  const bodyAction = typeof bodyData.action === "string" ? bodyData.action : undefined;
  const action = bodyAction || queryAction;

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Fetch Facebook credentials from settings
    const { data: settingsData } = await supabaseAdmin
      .from("settings")
      .select("key, value_encrypted")
      .eq("scope", "global")
      .in("key", ["facebook_app_id", "facebook_app_secret"]);

    const settingsMap = new Map(settingsData?.map(s => [s.key, s.value_encrypted]) || []);
    const FB_APP_ID = settingsMap.get("facebook_app_id");
    const FB_APP_SECRET = settingsMap.get("facebook_app_secret");

    // Validate Facebook configuration
    if (!FB_APP_ID || FB_APP_ID === "••••••••" || !FB_APP_SECRET || FB_APP_SECRET === "••••••••") {
      console.error("[FB-OAUTH] Facebook credentials not configured");
      return errorResponse(
        'FACEBOOK_NOT_CONFIGURED',
        'Facebook integration is not configured yet.',
        [
          'Super Admin needs to configure Facebook integration',
          'Go to Settings → Integrations → Facebook API',
          'Enter Facebook App ID and App Secret',
          'Get credentials from developers.facebook.com'
        ],
        500
      );
    }

    // Action: Get OAuth URL for Page Connection
    if (action === "get-auth-url") {
      // Page permissions - these require Advanced Access approval
      // IMPORTANT: All these must be approved in Facebook Developer Console
      // App Review > Permissions and Features
      const scopes = [
        "pages_show_list",
        "pages_read_engagement",
        "pages_manage_posts",
        "pages_read_user_content",
        "read_insights",
      ].join(",");

      const state = crypto.randomUUID(); // CSRF protection

      const redirectUri =
        (typeof bodyData.redirect_uri === "string" ? bodyData.redirect_uri : undefined) ||
        (typeof bodyData.redirectUri === "string" ? bodyData.redirectUri : undefined) ||
        url.searchParams.get("redirect_uri") ||
        defaultRedirectUri;

      // Build OAuth URL with properly encoded parameters using URL API
      const authUrl = new URL("https://www.facebook.com/v19.0/dialog/oauth");
      authUrl.searchParams.set("client_id", FB_APP_ID);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("scope", scopes);
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("response_type", "code");

      const authUrlString = authUrl.toString();

      console.log(`[FB-OAUTH] Generated auth URL: ${authUrlString}`);
      console.log(`[FB-OAUTH] Redirect URI: ${redirectUri}`);
      console.log(`[FB-OAUTH] Scopes: ${scopes}`);

      return new Response(
        JSON.stringify({ 
          authUrl: authUrlString, 
          state, 
          redirectUri,
          debug: {
            client_id: FB_APP_ID,
            redirect_uri: redirectUri,
            scope: scopes,
            response_type: "code"
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: Exchange code for page data (called from frontend callback component)
    // Back-compat: older clients POSTed { code } without an explicit action.
    if (
      action === "exchange-code" ||
      (req.method === "POST" && !action && (typeof bodyData.code === "string" || url.searchParams.get("code")))
    ) {
      const code = (typeof bodyData.code === "string" ? bodyData.code : null) || url.searchParams.get("code");

      const redirectUri =
        (typeof bodyData.redirect_uri === "string" ? bodyData.redirect_uri : undefined) ||
        (typeof bodyData.redirectUri === "string" ? bodyData.redirectUri : undefined) ||
        url.searchParams.get("redirect_uri") ||
        defaultRedirectUri;

      if (!code) {
        return errorResponse(
          'MISSING_CODE',
          'Authorization code is required.',
          ['This is an internal error. Please try again.'],
          400
        );
      }

      // Exchange code for access token
      const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?` +
        `client_id=${FB_APP_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `client_secret=${FB_APP_SECRET}&` +
        `code=${code}`;

      console.log(`[FB-OAUTH] Exchanging code for token with redirect: ${redirectUri}`);

      const tokenResponse = await fetch(tokenUrl);
      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        console.error("[FB-OAUTH] Token exchange failed:", tokenData.error);
        return errorResponse(
          'TOKEN_EXCHANGE_FAILED',
          tokenData.error.message || 'Failed to exchange authorization code.',
          ['Please try again', 'If the issue persists, contact support'],
          400
        );
      }

      // Get long-lived token
      const longLivedUrl = `https://graph.facebook.com/v19.0/oauth/access_token?` +
        `grant_type=fb_exchange_token&` +
        `client_id=${FB_APP_ID}&` +
        `client_secret=${FB_APP_SECRET}&` +
        `fb_exchange_token=${tokenData.access_token}`;

      const longLivedResponse = await fetch(longLivedUrl);
      const longLivedData = await longLivedResponse.json();

      const accessToken = longLivedData.access_token || tokenData.access_token;
      const expiresIn = longLivedData.expires_in || 60 * 60; // Default 1 hour

      // Get user's pages
      const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`;
      const pagesResponse = await fetch(pagesUrl);
      const pagesData = await pagesResponse.json();

      if (pagesData.error) {
        console.error("[FB-OAUTH] Failed to get pages:", pagesData.error);
        return errorResponse(
          'PAGES_FETCH_FAILED',
          pagesData.error.message || 'Failed to get your Facebook pages.',
          ['Make sure you have admin access to at least one Facebook page', 'Please try again'],
          400
        );
      }

      const pages = pagesData.data?.map((page: Record<string, unknown>) => ({
        id: page.id,
        name: page.name,
        access_token: page.access_token,
        category: page.category,
      })) || [];

      console.log(`[FB-OAUTH] Successfully fetched ${pages.length} pages`);

      return new Response(
        JSON.stringify({
          success: true,
          pages,
          userToken: accessToken,
          expiresIn,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Legacy callback action (kept for backwards compatibility)
    if (action === "callback") {
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      const errorDescription = url.searchParams.get("error_description");
      
      // Build redirect URL to frontend callback
      let frontendCallback = PRODUCTION_REDIRECT_URI;
      if (code) {
        frontendCallback += `?code=${encodeURIComponent(code)}`;
      } else if (error) {
        frontendCallback += `?error=${encodeURIComponent(error)}`;
        if (errorDescription) {
          frontendCallback += `&error_description=${encodeURIComponent(errorDescription)}`;
        }
      }
      
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          "Location": frontendCallback,
        }
      });
    }

    // Action: Save page connection
    if (action === "save-connection") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return errorResponse(
          'UNAUTHORIZED',
          'You must be logged in to connect a Facebook page.',
          ['Please log in and try again'],
          401
        );
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace("Bearer ", "");
      const { data: claims, error: authError } = await supabase.auth.getClaims(token);
      if (authError || !claims?.claims) {
        return errorResponse(
          'UNAUTHORIZED',
          'Your session has expired.',
          ['Please log in again'],
          401
        );
      }

      const userId = claims.claims.sub;
      const page_id = typeof bodyData.page_id === "string" ? bodyData.page_id : undefined;
      const page_name = typeof bodyData.page_name === "string" ? bodyData.page_name : undefined;
      const access_token = typeof bodyData.access_token === "string" ? bodyData.access_token : undefined;
      const expires_in = typeof bodyData.expires_in === "number" ? bodyData.expires_in : undefined;

      if (!page_id || !page_name || !access_token) {
        return errorResponse(
          'MISSING_FIELDS',
          'Missing required page information.',
          ['This is an internal error. Please try again.'],
          400
        );
      }

      // Exchange page token for a long-lived page token
      let finalToken = access_token;
      let tokenExpiresAt: string | null = null;

      try {
        const llUrl = `https://graph.facebook.com/v19.0/oauth/access_token?` +
          `grant_type=fb_exchange_token&` +
          `client_id=${FB_APP_ID}&` +
          `client_secret=${FB_APP_SECRET}&` +
          `fb_exchange_token=${access_token}`;
        
        const llRes = await fetch(llUrl);
        const llData = await llRes.json();
        
        if (llData.access_token) {
          finalToken = llData.access_token;
          const llExpiresIn = llData.expires_in || 5184000; // ~60 days default
          tokenExpiresAt = new Date(Date.now() + llExpiresIn * 1000).toISOString();
          console.log(`[FB-OAUTH] Exchanged for long-lived token, expires in ${llExpiresIn}s`);
        } else {
          console.warn("[FB-OAUTH] Long-lived token exchange failed, using original token", llData.error);
          // Use provided expires_in or default to 2 hours
          if (expires_in) {
            tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
          }
        }
      } catch (e) {
        console.warn("[FB-OAUTH] Long-lived token exchange error:", e);
        if (expires_in) {
          tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
        }
      }

      // Upsert connection with long-lived token
      const { data, error } = await supabase
        .from("fb_connections")
        .upsert({
          user_id: userId,
          page_id,
          page_name,
          access_token_encrypted: await encryptToken(finalToken),
          scopes: ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "pages_read_user_content", "read_insights"],
          is_active: true,
          connected_at: new Date().toISOString(),
          token_expires_at: tokenExpiresAt,
        }, {
          onConflict: "user_id,page_id",
        })
        .select()
        .single();

      if (error) {
        console.error("[FB-OAUTH] Error saving connection:", error);
        return errorResponse(
          'SAVE_FAILED',
          'Failed to save your Facebook page connection.',
          ['Please try again', 'If the issue persists, contact support'],
          500
        );
      }

      return new Response(
        JSON.stringify({ success: true, connection: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: Get page insights
    if (action === "get-insights") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return errorResponse(
          'UNAUTHORIZED',
          'You must be logged in to view insights.',
          ['Please log in and try again'],
          401
        );
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace("Bearer ", "");
      const { data: claims, error: authError } = await supabase.auth.getClaims(token);
      if (authError || !claims?.claims) {
        return errorResponse(
          'UNAUTHORIZED',
          'Your session has expired.',
          ['Please log in again'],
          401
        );
      }

      const userId = claims.claims.sub;
      const connectionId = url.searchParams.get("connection_id");

      // Get connection
      const { data: connection, error: connError } = await supabase
        .from("fb_connections")
        .select("*")
        .eq("id", connectionId)
        .eq("user_id", userId)
        .single();

      if (connError || !connection) {
        return errorResponse(
          'CONNECTION_NOT_FOUND',
          'Facebook page connection not found.',
          ['Please reconnect your Facebook page'],
          404
        );
      }

      const pageToken = await decryptToken(connection.access_token_encrypted);
      const pageId = connection.page_id;

      // Fetch page info
      const pageInfoUrl = `https://graph.facebook.com/v19.0/${pageId}?` +
        `fields=name,followers_count,fan_count,about,category&` +
        `access_token=${pageToken}`;
      
      const pageInfoRes = await fetch(pageInfoUrl);
      const pageInfo = await pageInfoRes.json();

      // Fetch page insights
      const insightsUrl = `https://graph.facebook.com/v19.0/${pageId}/insights?` +
        `metric=page_impressions,page_engaged_users,page_post_engagements,page_fans&` +
        `period=day&date_preset=last_30d&` +
        `access_token=${pageToken}`;
      
      const insightsRes = await fetch(insightsUrl);
      const insightsData = await insightsRes.json();

      // Fetch recent posts
      const postsUrl = `https://graph.facebook.com/v19.0/${pageId}/posts?` +
        `fields=id,message,created_time,shares,likes.summary(true),comments.summary(true)&` +
        `limit=10&` +
        `access_token=${pageToken}`;
      
      const postsRes = await fetch(postsUrl);
      const postsData = await postsRes.json();

      return new Response(
        JSON.stringify({
          pageInfo: pageInfo.error ? null : pageInfo,
          insights: insightsData.error ? [] : insightsData.data,
          posts: postsData.error ? [] : postsData.data,
          dataAvailability: {
            pageInfo: !pageInfo.error,
            insights: !insightsData.error,
            posts: !postsData.error,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return errorResponse(
      'INVALID_ACTION',
      'Invalid action specified.',
      ['This is an internal error. Please try again.'],
      400
    );
  } catch (error: unknown) {
    console.error("[FB-OAUTH] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return errorResponse(
      'UNKNOWN_ERROR',
      'An unexpected error occurred.',
      ['Please try again', 'If the issue persists, contact support'],
      500
    );
  }
});
