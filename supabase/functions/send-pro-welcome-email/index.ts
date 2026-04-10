import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProWelcomeRequest {
  email: string;
  fullName?: string;
  planName: string;
  amount?: number;
  currency?: string;
}

async function sendEmailWithResend(
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  html: string
) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Resend API error: ${response.status}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch email settings from database
    const { data: settingsData } = await supabaseAdmin
      .from("settings")
      .select("key, value_encrypted")
      .eq("scope", "global")
      .in("key", ["resend_api_key", "email_from_address", "email_from_name"]);

    const settingsMap = new Map(settingsData?.map(s => [s.key, s.value_encrypted]) || []);
    
    const resendApiKey = settingsMap.get("resend_api_key");
    const fromEmail = settingsMap.get("email_from_address") || "noreply@pagelyzer.com";
    const fromName = settingsMap.get("email_from_name") || "Pagelyzer";

    if (!resendApiKey || resendApiKey === "••••••••") {
      console.log("Resend API key not configured - skipping email");
      return new Response(
        JSON.stringify({ success: false, message: "Email provider not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, fullName, planName, amount, currency }: ProWelcomeRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    const formattedAmount = amount && currency 
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount)
      : null;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Pro!</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="text-align: center; padding: 30px 0;">
    <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%); padding: 15px 30px; border-radius: 50px;">
      <span style="font-size: 28px;">👑</span>
      <span style="color: white; font-size: 24px; font-weight: bold; margin-left: 10px;">Pro Member</span>
    </div>
  </div>

  <h1 style="color: #1a1a1a; text-align: center; font-size: 28px; margin-bottom: 10px;">
    Welcome to Pagelyzer Pro${fullName ? `, ${fullName}` : ''}! 🎉
  </h1>
  
  <p style="text-align: center; color: #666; font-size: 18px; margin-bottom: 30px;">
    Thank you for upgrading to <strong>${planName}</strong>
    ${formattedAmount ? `<br><span style="color: #10b981;">${formattedAmount} payment confirmed</span>` : ''}
  </p>

  <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 25px; margin: 20px 0;">
    <h2 style="color: #92400e; margin-top: 0; font-size: 18px;">🚀 Your Pro Features Are Now Active:</h2>
    <ul style="color: #78350f; padding-left: 20px;">
      <li style="margin-bottom: 10px;"><strong>Unlimited Audits</strong> — Run as many audits as you need</li>
      <li style="margin-bottom: 10px;"><strong>AI-Powered Insights</strong> — Get actionable recommendations</li>
      <li style="margin-bottom: 10px;"><strong>PDF Export</strong> — Download professional reports</li>
      <li style="margin-bottom: 10px;"><strong>Audience Demographics</strong> — Understand your followers</li>
      <li style="margin-bottom: 10px;"><strong>Report Sharing</strong> — Share reports with clients</li>
      <li style="margin-bottom: 10px;"><strong>30-Day History</strong> — Track performance over time</li>
    </ul>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://pagelyzer.io/dashboard" 
       style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%); color: white; text-decoration: none; padding: 15px 35px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);">
      Start Using Pro Features →
    </a>
  </div>

  <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
    <h3 style="color: #475569; margin-top: 0; font-size: 16px;">💡 Pro Tip</h3>
    <p style="color: #64748b; margin-bottom: 0;">
      Connect multiple Facebook pages to your account and run audits across all of them. 
      Pro members get unlimited page connections!
    </p>
  </div>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  
  <p style="color: #9ca3af; font-size: 14px; text-align: center;">
    Questions? Reply to this email or contact our support team.<br>
    We're here to help you get the most out of Pagelyzer Pro.
  </p>
  
  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
    © ${new Date().getFullYear()} Pagelyzer. All rights reserved.
  </p>
</body>
</html>
    `;

    await sendEmailWithResend(
      resendApiKey,
      `${fromName} <${fromEmail}>`,
      email,
      `👑 Welcome to Pagelyzer Pro, ${fullName || 'Champion'}!`,
      html
    );

    console.log("Pro welcome email sent successfully to:", email);

    return new Response(
      JSON.stringify({ success: true, message: "Pro welcome email sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in send-pro-welcome-email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
