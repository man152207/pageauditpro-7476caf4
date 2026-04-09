import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { encryptToken } from "../_shared/token-encryption.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

// Helper to save Facebook pages as connections during login
async function savePages(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  pages: Array<{ id: string; name: string; access_token: string }>,
  tokenExpiresIn?: number
) {
  for (const page of pages) {
    try {
      await supabaseAdmin
        .from("fb_connections")
        .upsert({
          user_id: userId,
          page_id: page.id,
          page_name: page.name,
          access_token_encrypted: await encryptToken(page.access_token),
          scopes: ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "pages_read_user_content", "read_insights"],
          is_active: true,
          connected_at: new Date().toISOString(),
          token_expires_at: tokenExpiresIn
            ? new Date(Date.now() + tokenExpiresIn * 1000).toISOString()
            : null,
        }, {
          onConflict: "user_id,page_id",
        });
      console.log(`[FB-AUTH-LOGIN] Saved page connection: ${page.name} (${page.id}) for user ${userId}`);
    } catch (e) {
      console.error(`[FB-AUTH-LOGIN] Failed to save page ${page.id}:`, e);
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const queryAction = url.searchParams.get("action");

  // Parse body early for POST requests to get action from body
  let bodyData: {
    action?: string;
    code?: string;
    email?: string;
    name?: string;
    picture?: string;
    facebookId?: string;
    redirect_uri?: string;
    redirectUri?: string;
  } = {};
  if (req.method === "POST") {
    try {
      bodyData = await req.json();
    } catch {
      // Body parsing failed, continue with empty object
    }
  }

  // Get action from body or query params
  const action = bodyData.action || queryAction;

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

    // Action: Test Connection (for Super Admin integration settings)
    if (action === "test") {
      if (!FB_APP_ID || FB_APP_ID === "••••••••" || !FB_APP_SECRET || FB_APP_SECRET === "••••••••") {
        console.log("[FB-AUTH-LOGIN] Test failed: credentials not configured");
        return errorResponse(
          'FACEBOOK_NOT_CONFIGURED',
          'Facebook credentials are not configured.',
          ['Go to Settings → Integrations → Facebook API', 'Enter Facebook App ID and App Secret'],
          400
        );
      }
      
      console.log("[FB-AUTH-LOGIN] Connection test successful (credentials configured)");
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Facebook credentials are configured.',
          note: 'Full OAuth validation occurs during login flow.',
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate Facebook configuration for other actions
    if (!FB_APP_ID || FB_APP_ID === "••••••••" || !FB_APP_SECRET || FB_APP_SECRET === "••••••••") {
      console.error("[FB-AUTH-LOGIN] Facebook credentials not configured");
      return errorResponse(
        'FACEBOOK_NOT_CONFIGURED',
        'Facebook login is not configured yet.',
        [
          'Super Admin needs to configure Facebook integration',
          'Go to Settings → Integrations → Facebook API',
          'Enter Facebook App ID and App Secret',
          'Get credentials from developers.facebook.com'
        ],
        500
      );
    }

  // ALWAYS use production domain for OAuth redirects per project requirements
  const PRODUCTION_ORIGIN = "https://pagelyzer.io";
  const defaultRedirectUri = `${PRODUCTION_ORIGIN}/api/auth/facebook/login/callback`;

    // Action: Get login URL
    if (action === "get-login-url") {
      // Facebook Login scope - request all permissions upfront
      // email: Standard Access (approved)
      // pages_*: Ready for testing (only works for App Admins/Testers until App Review approved)
      // read_insights: Ready for testing (requires App Review for production)
      const scopes = [
        "email",
        "pages_show_list",
        "pages_read_engagement",
        "pages_manage_posts",
        "pages_read_user_content",
        "read_insights"
      ].join(",");

      const state = crypto.randomUUID(); // CSRF protection

      const redirectUri =
        bodyData.redirect_uri ||
        // @ts-ignore - tolerate legacy key
        (bodyData as any).redirectUri ||
        url.searchParams.get("redirect_uri") ||
        defaultRedirectUri;

      // Build OAuth URL with properly encoded parameters
      const authUrl = new URL("https://www.facebook.com/v19.0/dialog/oauth");
      authUrl.searchParams.set("client_id", FB_APP_ID);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("scope", scopes);
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("response_type", "code");
      
      const authUrlString = authUrl.toString();

      console.log(`[FB-AUTH-LOGIN] Generated auth URL: ${authUrlString}`);
      console.log(`[FB-AUTH-LOGIN] Redirect URI: ${redirectUri}`);
      console.log(`[FB-AUTH-LOGIN] Scopes: ${scopes}`);

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

    // Action: Exchange code for user data (called from frontend callback component)
    if (action === "exchange-code") {
      const code = bodyData.code || url.searchParams.get("code");
      const redirectUri =
        // @ts-ignore - tolerate legacy key
        (bodyData as any).redirect_uri ||
        // @ts-ignore
        (bodyData as any).redirectUri ||
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

      console.log(`[FB-AUTH-LOGIN] Exchanging code for token with redirect: ${redirectUri}`);

      const tokenResponse = await fetch(tokenUrl);
      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        console.error("[FB-AUTH-LOGIN] Token exchange failed:", tokenData.error);
        return errorResponse(
          'TOKEN_EXCHANGE_FAILED',
          tokenData.error.message || 'Failed to exchange authorization code.',
          ['Please try again', 'If the issue persists, contact support'],
          400
        );
      }

      const accessToken = tokenData.access_token;

      // Get long-lived token for page connections
      let longLivedToken = accessToken;
      let tokenExpiresIn = 3600;
      try {
        const longLivedUrl = `https://graph.facebook.com/v21.0/oauth/access_token?` +
          `grant_type=fb_exchange_token&` +
          `client_id=${FB_APP_ID}&` +
          `client_secret=${FB_APP_SECRET}&` +
          `fb_exchange_token=${accessToken}`;
        const llRes = await fetch(longLivedUrl);
        const llData = await llRes.json();
        if (llData.access_token) {
          longLivedToken = llData.access_token;
          tokenExpiresIn = llData.expires_in || 5184000;
        }
      } catch (e) {
        console.warn("[FB-AUTH-LOGIN] Long-lived token exchange failed, using short-lived:", e);
      }

      // Get user info from Facebook
      const userInfoUrl = `https://graph.facebook.com/v21.0/me?fields=id,name,email,picture.width(200).height(200)&access_token=${longLivedToken}`;
      const userInfoResponse = await fetch(userInfoUrl);
      const userData = await userInfoResponse.json();

      if (userData.error) {
        console.error("[FB-AUTH-LOGIN] Failed to get user info:", userData.error);
        return errorResponse(
          'USER_INFO_FAILED',
          userData.error.message || 'Failed to get user information from Facebook.',
          ['Please try again'],
          400
        );
      }

      const fbUserId = userData.id;
      const fbName = userData.name;
      const fbEmail = userData.email;
      const fbPicture = userData.picture?.data?.url;

      if (!fbEmail) {
        return errorResponse(
          'EMAIL_REQUIRED',
          'Email permission is required.',
          ['Please try again and allow email access when prompted by Facebook'],
          400
        );
      }

      // Also fetch user's Facebook pages so we can auto-save them during login
      let pages: Array<{ id: string; name: string; access_token: string; category?: string }> = [];
      try {
        const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?access_token=${longLivedToken}`;
        const pagesRes = await fetch(pagesUrl);
        const pagesData = await pagesRes.json();
        if (!pagesData.error && pagesData.data) {
          pages = pagesData.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            access_token: p.access_token,
            category: p.category,
          }));
        }
        console.log(`[FB-AUTH-LOGIN] Fetched ${pages.length} pages during login`);
      } catch (e) {
        console.warn("[FB-AUTH-LOGIN] Failed to fetch pages during login:", e);
      }

      console.log(`[FB-AUTH-LOGIN] User authenticated: ${fbEmail}, name: ${fbName}`);

      // Return user data + pages to frontend (frontend will call complete-login)
      return new Response(
        JSON.stringify({
          success: true,
          userData: {
            facebookId: fbUserId,
            email: fbEmail,
            name: fbName || '',
            picture: fbPicture || '',
          },
          pages,
          tokenExpiresIn,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Legacy callback action (kept for backwards compatibility, but frontend now handles this)
    if (action === "callback") {
      // Redirect to frontend callback handler which will call exchange-code
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      const errorDescription = url.searchParams.get("error_description");
      
      // Build redirect URL to frontend callback
      let frontendCallback = defaultRedirectUri;
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

    // Action: Complete login (called from frontend after popup callback)
    if (action === "complete-login") {
      const { email, name, picture, facebookId } = bodyData;
      const pages = (bodyData as any).pages as Array<{ id: string; name: string; access_token: string }> | undefined;
      const tokenExpiresIn = (bodyData as any).tokenExpiresIn as number | undefined;

      if (!email) {
        return errorResponse(
          'MISSING_EMAIL',
          'Email is required for Facebook login.',
          ['Please ensure you allow email access when connecting with Facebook'],
          400
        );
      }

      // Check if user exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find((u) => u.email === email);

      let userId: string | undefined;

      if (existingUser) {
        userId = existingUser.id;
        // User exists - generate magic link token for login
        const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: email,
        });

        if (signInError) {
          console.error("[FB-AUTH-LOGIN] Sign in error:", signInError);
          return errorResponse(
            'AUTH_FAILED',
            'Failed to sign in with Facebook.',
            ['Please try again or use email/password login'],
            500
          );
        }

        // Update profile with Facebook picture if available
        if (picture && existingUser.id) {
          await supabaseAdmin
            .from("profiles")
            .update({ 
              avatar_url: picture,
              updated_at: new Date().toISOString()
            })
            .eq("user_id", existingUser.id);
        }

        // Save pages to fb_connections
        if (pages && pages.length > 0 && userId) {
          await savePages(supabaseAdmin, userId, pages, tokenExpiresIn);
        }

        return new Response(
          JSON.stringify({
            success: true,
            isNewUser: false,
            userId: existingUser.id,
            properties: signInData.properties,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // New user - create account
        const tempPassword = crypto.randomUUID();
        
        const { data: newUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name: name,
            avatar_url: picture,
            facebook_id: facebookId,
            provider: 'facebook',
          }
        });

        if (signUpError) {
          console.error("[FB-AUTH-LOGIN] Sign up error:", signUpError);
          return errorResponse(
            'SIGNUP_FAILED',
            'Failed to create account with Facebook.',
            ['This email might already be registered', 'Try logging in with email/password instead'],
            500
          );
        }

        userId = newUser?.user?.id;

        // Update profile with avatar
        if (userId && picture) {
          await supabaseAdmin
            .from("profiles")
            .update({ 
              avatar_url: picture,
              full_name: name,
              updated_at: new Date().toISOString()
            })
            .eq("user_id", userId);
        }

        // Save pages to fb_connections
        if (pages && pages.length > 0 && userId) {
          await savePages(supabaseAdmin, userId, pages, tokenExpiresIn);
        }

        // Generate sign in link
        const { data: signInData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: email,
        });

        if (linkError) {
          console.error("[FB-AUTH-LOGIN] Generate link error:", linkError);
        }

        return new Response(
          JSON.stringify({
            success: true,
            isNewUser: true,
            userId,
            properties: signInData?.properties,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return errorResponse(
      'INVALID_ACTION',
      'Invalid action specified.',
      ['This is an internal error. Please try again.'],
      400
    );
  } catch (error: unknown) {
    console.error("[FB-AUTH-LOGIN] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return errorResponse(
      'UNKNOWN_ERROR',
      'An unexpected error occurred during Facebook login.',
      ['Please try again', 'If the issue persists, contact support'],
      500
    );
  }
});
