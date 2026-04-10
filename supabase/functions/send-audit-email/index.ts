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

// Email template for audit reports
function getAuditReportEmailHtml(data: {
  userName: string;
  pageName: string;
  score: number;
  scoreChange: string;
  topRecommendations: string[];
  reportUrl: string;
  unsubscribeUrl: string;
}) {
  const scoreColor = data.score >= 80 ? '#22c55e' : data.score >= 60 ? '#f59e0b' : '#ef4444';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Facebook Page Audit Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="padding: 32px 24px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">📊 Pagelyzer</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Your Facebook Page Audit Report</p>
      </td>
    </tr>
    
    <!-- Main Content -->
    <tr>
      <td style="padding: 32px 24px;">
        <p style="margin: 0 0 16px; font-size: 16px; color: #333;">Hi ${data.userName},</p>
        <p style="margin: 0 0 24px; font-size: 15px; color: #666; line-height: 1.5;">
          Great news! We've analyzed your Facebook Page <strong>"${data.pageName}"</strong> and here's what we found:
        </p>
        
        <!-- Score Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
          <tr>
            <td style="background-color: #f8fafc; border-radius: 12px; padding: 24px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Overall Score</p>
              <p style="margin: 0; font-size: 48px; font-weight: 700; color: ${scoreColor};">${data.score}</p>
              <p style="margin: 8px 0 0; font-size: 13px; color: #888;">${data.scoreChange}</p>
            </td>
          </tr>
        </table>
        
        <!-- Recommendations -->
        <h2 style="margin: 0 0 16px; font-size: 18px; color: #333;">Top Recommendations</h2>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
          ${data.topRecommendations.map((rec, i) => `
          <tr>
            <td style="padding: 12px 16px; background-color: ${i % 2 === 0 ? '#f8fafc' : '#ffffff'}; border-left: 3px solid #3b82f6;">
              <p style="margin: 0; font-size: 14px; color: #333;">• ${rec}</p>
            </td>
          </tr>
          `).join('')}
        </table>
        
        <!-- CTA Button -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="text-align: center; padding: 16px 0;">
              <a href="${data.reportUrl}" style="display: inline-block; padding: 14px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px;">
                View Full Report →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="padding: 24px; background-color: #f8fafc; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px; font-size: 13px; color: #888; text-align: center;">
          You're receiving this because you connected your Facebook Page to Pagelyzer.
        </p>
        <p style="margin: 0; font-size: 13px; color: #888; text-align: center;">
          <a href="${data.unsubscribeUrl}" style="color: #3b82f6; text-decoration: underline;">Manage email preferences</a> | 
          <a href="${data.unsubscribeUrl}&action=unsubscribe" style="color: #888; text-decoration: underline;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Weekly summary email template
function getWeeklySummaryEmailHtml(data: {
  userName: string;
  pages: Array<{ name: string; score: number; change: number }>;
  dashboardUrl: string;
  unsubscribeUrl: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Page Performance Summary</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 32px 24px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">📈 Weekly Performance Summary</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Here's how your pages performed this week</p>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 32px 24px;">
        <p style="margin: 0 0 24px; font-size: 16px; color: #333;">Hi ${data.userName},</p>
        
        <h2 style="margin: 0 0 16px; font-size: 18px; color: #333;">Your Connected Pages</h2>
        
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <tr style="background-color: #f8fafc;">
            <th style="padding: 12px 16px; text-align: left; font-size: 13px; color: #666; font-weight: 600;">Page</th>
            <th style="padding: 12px 16px; text-align: center; font-size: 13px; color: #666; font-weight: 600;">Score</th>
            <th style="padding: 12px 16px; text-align: right; font-size: 13px; color: #666; font-weight: 600;">Change</th>
          </tr>
          ${data.pages.map((page, i) => `
          <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            <td style="padding: 12px 16px; font-size: 14px; color: #333;">${page.name}</td>
            <td style="padding: 12px 16px; text-align: center; font-size: 14px; font-weight: 600; color: ${page.score >= 80 ? '#22c55e' : page.score >= 60 ? '#f59e0b' : '#ef4444'};">${page.score}</td>
            <td style="padding: 12px 16px; text-align: right; font-size: 14px; color: ${page.change >= 0 ? '#22c55e' : '#ef4444'};">
              ${page.change >= 0 ? '↑' : '↓'} ${Math.abs(page.change)}%
            </td>
          </tr>
          `).join('')}
        </table>
        
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="text-align: center; padding: 16px 0;">
              <a href="${data.dashboardUrl}" style="display: inline-block; padding: 14px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px;">
                View Dashboard →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 24px; background-color: #f8fafc; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 13px; color: #888; text-align: center;">
          <a href="${data.unsubscribeUrl}" style="color: #3b82f6; text-decoration: underline;">Manage email preferences</a> | 
          <a href="${data.unsubscribeUrl}&action=unsubscribe" style="color: #888; text-decoration: underline;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Fetch email provider credentials from settings
    const { data: settingsData } = await supabaseAdmin
      .from("settings")
      .select("key, value_encrypted")
      .eq("scope", "global")
      .in("key", ["resend_api_key", "email_from_address", "email_from_name"]);

    const settingsMap = new Map(settingsData?.map(s => [s.key, s.value_encrypted]) || []);
    const RESEND_API_KEY = settingsMap.get("resend_api_key");
    const FROM_EMAIL = settingsMap.get("email_from_address") || "noreply@pagelyzer.io";
    const FROM_NAME = settingsMap.get("email_from_name") || "Pagelyzer";

    // Validate email configuration
    if (!RESEND_API_KEY || RESEND_API_KEY === "••••••••") {
      console.error("[EMAIL] Resend API Key not configured");
      return errorResponse(
        'EMAIL_NOT_CONFIGURED',
        'Email service is not configured.',
        [
          'Super Admin: Go to Settings → Integrations → Email',
          'Enter your Resend API Key',
          'Get your API key from resend.com'
        ],
        ['resend_api_key'],
        500
      );
    }

    const { type, userId, auditId, data } = await req.json();

    if (!type || !userId) {
      return errorResponse('INVALID_REQUEST', 'Missing required fields.', ['Provide type and userId'], undefined, 400);
    }

    // Get user info
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", userId)
      .single();

    if (!profile?.email) {
      console.error("[EMAIL] User email not found");
      return errorResponse('USER_NOT_FOUND', 'User email not found.', ['Ensure user has email configured'], undefined, 404);
    }

    // Check email preferences
    const { data: prefs } = await supabaseAdmin
      .from("settings")
      .select("key, value_encrypted")
      .eq("scope", "user")
      .eq("scope_id", userId)
      .like("key", "email_%");

    const prefsMap = new Map(prefs?.map(p => [p.key, p.value_encrypted]) || []);
    
    // Check if unsubscribed
    if (prefsMap.get("email_unsubscribed_all") === "true") {
      console.log("[EMAIL] User has unsubscribed from all emails");
      return new Response(
        JSON.stringify({ success: true, message: "User has unsubscribed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = 'https://pagelyzer.io';
    const unsubscribeUrl = `${baseUrl}/dashboard/settings?email=preferences&user=${userId}`;

    let subject = "";
    let htmlContent = "";

    if (type === "audit_report") {
      if (prefsMap.get("email_audit_reports") === "false") {
        return new Response(
          JSON.stringify({ success: true, message: "User disabled audit report emails" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      subject = `📊 New Audit Report: ${data.pageName}`;
      htmlContent = getAuditReportEmailHtml({
        userName: profile.full_name || "there",
        pageName: data.pageName || "Your Page",
        score: data.score || 0,
        scoreChange: data.scoreChange || "No previous data",
        topRecommendations: data.recommendations || ["Connect your Facebook page for recommendations"],
        reportUrl: `${baseUrl}/dashboard/reports/${auditId}`,
        unsubscribeUrl,
      });
    } else if (type === "weekly_summary") {
      if (prefsMap.get("email_weekly_summaries") === "false") {
        return new Response(
          JSON.stringify({ success: true, message: "User disabled weekly summary emails" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      subject = "📈 Your Weekly Facebook Page Summary";
      htmlContent = getWeeklySummaryEmailHtml({
        userName: profile.full_name || "there",
        pages: data.pages || [],
        dashboardUrl: `${baseUrl}/dashboard`,
        unsubscribeUrl,
      });
    } else {
      return errorResponse('INVALID_EMAIL_TYPE', 'Unknown email type.', ['Use audit_report or weekly_summary'], undefined, 400);
    }

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [profile.email],
        subject,
        html: htmlContent,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("[EMAIL] Resend API error:", emailResult);
      return errorResponse(
        'EMAIL_SEND_FAILED',
        'Failed to send email.',
        ['Check Resend API key is valid', 'Verify sending domain is configured'],
        undefined,
        500
      );
    }

    console.log("[EMAIL] Email sent successfully:", emailResult.id);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[EMAIL] Error:", error);
    return errorResponse(
      'UNKNOWN_ERROR',
      'An unexpected error occurred sending email.',
      ['Please try again', 'If the issue persists, contact support'],
      undefined,
      500
    );
  }
});
