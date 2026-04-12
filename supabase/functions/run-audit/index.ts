import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { decryptToken } from "../_shared/token-encryption.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RUN-AUDIT] ${step}${detailsStr}`);
};

// Convert any date string (ISO or date-only) to Unix timestamp (seconds)
function toUnixTimestamp(dateStr: string): number {
  return Math.floor(new Date(dateStr).getTime() / 1000);
}

// Convert preset to since/until as Unix timestamps
function getDateRangeFromPreset(preset: string): { since: string; until: string } {
  const now = new Date();
  const untilTs = Math.floor(now.getTime() / 1000);
  let since: Date;

  switch (preset) {
    case '7d':
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '3m':
      since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '6m':
      since = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      since = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return {
    since: String(Math.floor(since.getTime() / 1000)),
    until: String(untilTs),
  };
}

// Calculate engagement score (0-100)
function calculateEngagementScore(metrics: any): number {
  const { totalEngagements, followers, postsCount } = metrics;
  if (!followers || !postsCount) return 50;
  
  const avgEngagementPerPost = totalEngagements / postsCount;
  const engagementRate = (avgEngagementPerPost / followers) * 100;
  
  if (engagementRate >= 5) return 100;
  if (engagementRate >= 3) return 85;
  if (engagementRate >= 1) return 65;
  if (engagementRate >= 0.5) return 45;
  return Math.max(20, engagementRate * 20);
}

// Calculate consistency score based on posting frequency
function calculateConsistencyScore(postsPerWeek: number): number {
  if (postsPerWeek >= 7) return 100;
  if (postsPerWeek >= 5) return 85;
  if (postsPerWeek >= 3) return 70;
  if (postsPerWeek >= 1) return 50;
  return 20;
}

// Calculate readiness score based on page optimization
function calculateReadinessScore(pageInfo: any): number {
  let score = 0;
  if (pageInfo.about) score += 25;
  if (pageInfo.category) score += 25;
  if (pageInfo.website) score += 25;
  if (pageInfo.phone) score += 25;
  return score;
}

// Generate recommendations based on scores
function generateRecommendations(scores: any, metrics: any, isPro: boolean): any[] {
  const recommendations: any[] = [];
  
  if (scores.engagement < 50) {
    recommendations.push({
      priority: "high",
      category: "engagement",
      title: "Improve Post Engagement",
      description: "Your engagement rate is below average. Focus on creating more interactive content.",
      isPro: false,
    });
  }
  
  if (scores.consistency < 60) {
    recommendations.push({
      priority: "high",
      category: "consistency",
      title: "Increase Posting Frequency",
      description: "Post more regularly to maintain audience interest. Aim for 3-5 posts per week.",
      isPro: false,
    });
  }

  if (isPro) {
    if (metrics.topPostType) {
      recommendations.push({
        priority: "medium",
        category: "content",
        title: `Focus on ${metrics.topPostType} Content`,
        description: `Your ${metrics.topPostType} posts perform better than other content types.`,
        isPro: true,
      });
    }

    recommendations.push({
      priority: "medium",
      category: "timing",
      title: "Optimize Posting Times",
      description: "Based on your audience activity, the best times to post are weekdays 6-8 PM.",
      isPro: true,
    });

    if (scores.readiness < 75) {
      recommendations.push({
        priority: "low",
        category: "optimization",
        title: "Complete Page Profile",
        description: "Add missing profile information to improve page discoverability.",
        isPro: true,
      });
    }
  }

  return recommendations;
}

// Build time-series data from insights array
function buildTimeSeries(insights: any[], metricName: string): { date: string; value: number }[] {
  const metric = insights.find(m => m.name === metricName);
  if (!metric?.values?.length) return [];
  
  return metric.values.map((v: any) => ({
    date: v.end_time?.split('T')[0] || '',
    value: v.value || 0,
  })).filter((v: any) => v.date);
}

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

    const { connection_id, date_range } = await req.json();

    if (!connection_id) {
      return new Response(
        JSON.stringify({ error: "connection_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse date range - ACTUALLY APPLY IT to API calls
    const requestedRange = date_range || { preset: '30d' };
    let dateParams: { since: string; until: string };
    
    if (requestedRange.from && requestedRange.to) {
      // Custom date range - convert ISO to Unix timestamps
      dateParams = { 
        since: String(toUnixTimestamp(requestedRange.from)), 
        until: String(toUnixTimestamp(requestedRange.to)) 
      };
    } else {
      // Preset conversion (already returns Unix timestamps)
      dateParams = getDateRangeFromPreset(requestedRange.preset || '30d');
    }
    
    logStep("Date range applied", { requestedRange, dateParams });

    // Check subscription status
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*, plan:plans(*)")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    const isPro = !!subscription && subscription.plan?.billing_type !== "free";
    logStep("Subscription check", { isPro });

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

    // Check usage limits for free users
    if (!isPro && !hasFreeAuditGrant) {
      const { count } = await supabase
        .from("audits")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", startOfMonth.toISOString());

      const limits = (subscription?.plan?.limits as any) || { audits_per_month: 3 };
      const auditsLimit = limits.audits_per_month || 3;

      if ((count || 0) >= auditsLimit) {
        return new Response(
          JSON.stringify({ 
            error: "Monthly audit limit reached",
            limit: auditsLimit,
            used: count,
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get connection
    const { data: connection, error: connError } = await supabase
      .from("fb_connections")
      .select("*")
      .eq("id", connection_id)
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: "Connection not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Connection found", { pageId: connection.page_id, pageName: connection.page_name });

    const pageToken = await decryptToken(connection.access_token_encrypted);
    const pageId = connection.page_id;

    // Validate token before proceeding
    try {
      const validateUrl = `https://graph.facebook.com/v21.0/${pageId}?fields=name&access_token=${pageToken}`;
      const validateRes = await fetch(validateUrl);
      const validateData = await validateRes.json();
      
      if (validateData.error) {
        const errCode = validateData.error.code;
        const errMsg = validateData.error.message || 'Unknown error';
        logStep("Token validation FAILED", { code: errCode, message: errMsg });
        
        // Mark connection as needing reconnection
        await supabase
          .from("fb_connections")
          .update({ token_expires_at: new Date(0).toISOString() })
          .eq("id", connection_id);
        
        return new Response(
          JSON.stringify({ 
            error: "token_expired",
            human_message: "Your Facebook connection has expired. Please disconnect and reconnect your page to get a fresh token.",
            fix_steps: [
              "Go to your connected pages list",
              "Click 'Reconnect' on the affected page",
              "Re-authorize with Facebook",
              "Run the audit again"
            ],
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      logStep("Token validated successfully", { pageName: validateData.name });
    } catch (e) {
      logStep("Token validation error", { error: e });
    }

    // Fetch page info from Facebook
    let pageInfo: any = {};
    let insights: any[] = [];
    let posts: any[] = [];
    let dataAvailability: any = {};

    try {
      const pageInfoUrl = `https://graph.facebook.com/v21.0/${pageId}?` +
        `fields=name,followers_count,fan_count,about,category,website,phone&` +
        `access_token=${pageToken}`;
      
      const pageInfoRes = await fetch(pageInfoUrl);
      pageInfo = await pageInfoRes.json();
      dataAvailability.pageInfo = !pageInfo.error;
      logStep("Page info fetched", { success: !pageInfo.error });
    } catch (e) {
      logStep("Page info fetch failed", { error: e });
      dataAvailability.pageInfo = false;
    }

    // Fetch insights WITH DATE RANGE using since/until
    try {
      // Valid metrics per FB docs (Nov 2025+): page_follows replaces page_fans, page_media_view replaces page_impressions
      const insightsUrl = `https://graph.facebook.com/v21.0/${pageId}/insights?` +
        `metric=page_media_view,page_post_engagements,page_follows&` +
        `period=day&since=${dateParams.since}&until=${dateParams.until}&` +
        `access_token=${pageToken}`;
      
      const insightsRes = await fetch(insightsUrl);
      const insightsData = await insightsRes.json();
      if (insightsData.error) {
        logStep("Insights API error", insightsData.error);
        dataAvailability.insights = false;
        dataAvailability.insightsError = insightsData.error.message || 'Unknown error';
      } else {
        insights = insightsData.data || [];
        dataAvailability.insights = insights.length > 0;
      }
      logStep("Insights fetched with date range", { 
        success: !insightsData.error, 
        count: insights.length,
        since: dateParams.since,
        until: dateParams.until
      });
    } catch (e) {
      logStep("Insights fetch failed", { error: e });
      dataAvailability.insights = false;
    }

    // Fetch posts WITH DATE RANGE using since/until
    try {
      const postsUrl = `https://graph.facebook.com/v21.0/${pageId}/posts?` +
        `fields=id,message,created_time,shares,likes.summary(true),comments.summary(true),type,` +
        `permalink_url,full_picture&` +
        `since=${dateParams.since}&until=${dateParams.until}&` +
        `limit=100&` +
        `access_token=${pageToken}`;
      
      const postsRes = await fetch(postsUrl);
      const postsData = await postsRes.json();
      if (postsData.error) {
        logStep("Posts API error", postsData.error);
        dataAvailability.posts = false;
        // Check for permission errors (code 10 or 200 = permission not granted)
        const errCode = postsData.error.code;
        if (errCode === 10 || errCode === 200) {
          dataAvailability.postsError = 'permission_not_granted';
          dataAvailability.postsErrorMessage = 'pages_read_user_content permission not approved by Meta';
        } else {
          dataAvailability.postsError = postsData.error.message || 'Unknown error';
        }
      } else {
        posts = postsData.data || [];
        dataAvailability.posts = true;
      }
      logStep("Posts fetched with date range", { 
        success: !postsData.error, 
        count: posts.length,
        since: dateParams.since,
        until: dateParams.until
      });
    } catch (e) {
      logStep("Posts fetch failed", { error: e });
      dataAvailability.posts = false;
    }

    // Fetch post-level insights for paid/organic breakdown
    let postInsights: Record<string, any> = {};
    let totalPaidImpressions = 0;
    let totalOrganicImpressions = 0;
    let hasAnyPostInsights = false;
    
    if (posts.length > 0) {
      try {
        // Fetch insights for up to 25 posts
        const postIds = posts.slice(0, 25).map((p: any) => p.id);
        for (const postId of postIds) {
          try {
            const insightUrl = `https://graph.facebook.com/v21.0/${postId}/insights?` +
              `metric=post_impressions,post_impressions_organic,post_impressions_paid,post_engaged_users,post_clicks&` +
              `access_token=${pageToken}`;
            const insightRes = await fetch(insightUrl);
            const insightData = await insightRes.json();
            if (!insightData.error && insightData.data) {
              hasAnyPostInsights = true;
              postInsights[postId] = {};
              insightData.data.forEach((metric: any) => {
                const val = metric.values?.[0]?.value || 0;
                postInsights[postId][metric.name] = val;
                if (metric.name === 'post_impressions_paid') totalPaidImpressions += val;
                if (metric.name === 'post_impressions_organic') totalOrganicImpressions += val;
              });
            }
          } catch (e) {
            // Individual post insight failure is non-blocking
          }
        }
        dataAvailability.postInsights = hasAnyPostInsights;
        logStep("Post insights fetched", { 
          count: Object.keys(postInsights).length,
          totalPaid: totalPaidImpressions,
          totalOrganic: totalOrganicImpressions
        });
      } catch (e) {
        logStep("Post insights fetch failed", { error: e });
        dataAvailability.postInsights = false;
      }
    }

    // Demographics for Pro users
    let demographics: any = null;
    const hasProAccess = isPro || hasFreeAuditGrant;

    if (hasProAccess) {
      try {
        // Demographics metrics (page_fans_gender_age, page_follows_gender_age etc.) 
        // were deprecated by Meta in March 2024 with no replacement.
        // We attempt the call but gracefully handle the expected failure.
        const demoUrl = `https://graph.facebook.com/v21.0/${pageId}/insights?` +
          `metric=page_follows_gender_age,page_follows_city,page_follows_country&` +
          `period=lifetime&access_token=${pageToken}`;
        
        const demoRes = await fetch(demoUrl);
        const demoData = await demoRes.json();
        
        if (!demoData.error && demoData.data) {
          const genderAge = demoData.data.find((d: any) => d.name === 'page_follows_gender_age');
          const cities = demoData.data.find((d: any) => d.name === 'page_follows_city');
          const countries = demoData.data.find((d: any) => d.name === 'page_follows_country');
          
          demographics = {
            genderAge: genderAge?.values?.[0]?.value || null,
            cities: cities?.values?.[0]?.value || null,
            countries: countries?.values?.[0]?.value || null,
          };
          dataAvailability.demographics = true;
        } else {
          // Expected: these metrics are deprecated since March 2024
          logStep("Demographics unavailable (deprecated metrics)", { 
            error: demoData.error?.message || 'Unknown' 
          });
          dataAvailability.demographics = false;
          dataAvailability.demographicsError = 'Demographics metrics deprecated by Meta (March 2024). No replacement available.';
        }
        logStep("Demographics fetched", { success: !!demographics });
      } catch (e) {
        logStep("Demographics fetch failed", { error: e });
        dataAvailability.demographics = false;
        dataAvailability.demographicsError = 'Demographics metrics are no longer available from Facebook API.';
      }
    }

    // Calculate metrics
    const followers = pageInfo.followers_count || pageInfo.fan_count || 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;

    posts.forEach((post: any) => {
      totalLikes += post.likes?.summary?.total_count || 0;
      totalComments += post.comments?.summary?.total_count || 0;
      totalShares += post.shares?.count || 0;
    });

    const totalEngagements = totalLikes + totalComments + totalShares;
    const postsCount = posts.length || 1;

    // Calculate posts per week
    let postsPerWeek = 3;
    if (posts.length >= 2) {
      const firstPost = new Date(posts[posts.length - 1].created_time);
      const lastPost = new Date(posts[0].created_time);
      const daysDiff = Math.max(1, (lastPost.getTime() - firstPost.getTime()) / (1000 * 60 * 60 * 24));
      postsPerWeek = Math.round((posts.length / daysDiff) * 7 * 10) / 10;
    }

    const metrics = {
      followers,
      totalEngagements,
      totalLikes,
      totalComments,
      totalShares,
      postsCount,
      postsPerWeek,
      avgEngagementPerPost: Math.round((totalEngagements / postsCount) * 10) / 10,
      engagementRate: Math.round((totalEngagements / postsCount / followers) * 10000) / 100,
      topPostType: posts[0]?.type || "status",
    };

    // Calculate scores
    const engagementScore = Math.round(calculateEngagementScore(metrics));
    const consistencyScore = Math.round(calculateConsistencyScore(postsPerWeek));
    const readinessScore = Math.round(calculateReadinessScore(pageInfo));
    const overallScore = Math.round(engagementScore * 0.4 + consistencyScore * 0.35 + readinessScore * 0.25);

    const scores = {
      overall: overallScore,
      engagement: engagementScore,
      consistency: consistencyScore,
      readiness: readinessScore,
    };

    logStep("Scores calculated", scores);

    const recommendations = generateRecommendations(scores, metrics, hasProAccess);

    // Create audit record
    const { data: audit, error: auditError } = await supabase
      .from("audits")
      .insert({
        user_id: userId,
        fb_connection_id: connection_id,
        audit_type: "automatic",
        page_name: connection.page_name,
        page_url: `https://facebook.com/${pageId}`,
        input_data: {
          followers,
          postsPerWeek,
          totalLikes,
          totalComments,
          totalShares,
          totalEngagements,
          postsAnalyzed: postsCount,
          engagementRate: metrics.engagementRate,
          avgEngagementPerPost: metrics.avgEngagementPerPost,
          dateRange: dateParams,
        },
        score_total: overallScore,
        score_breakdown: scores,
        recommendations: recommendations.filter(r => !r.isPro || hasProAccess),
        is_pro_unlocked: hasProAccess,
      })
      .select()
      .single();

    if (auditError) {
      logStep("Audit creation failed", { error: auditError.message });
      return new Response(
        JSON.stringify({ error: "Failed to create audit" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Audit created", { auditId: audit.id });

    // Build trend time-series from insights
    const trendData = {
      impressions: buildTimeSeries(insights, 'page_media_view'),
      engagedUsers: buildTimeSeries(insights, 'page_post_engagements'),
      postEngagements: buildTimeSeries(insights, 'page_post_engagements'),
      fans: buildTimeSeries(insights, 'page_follows'),
    };
    
    const hasTrendData = Object.values(trendData).some(arr => arr.length > 0);
    logStep("Trend data built", { 
      impressionsCount: trendData.impressions.length,
      engagedUsersCount: trendData.engagedUsers.length,
      hasTrendData
    });

    // Calculate paid vs organic - CORRECTLY
    const totalImpressions = totalPaidImpressions + totalOrganicImpressions;
    let paidVsOrganic: any = null;
    
    if (hasAnyPostInsights) {
      if (totalImpressions > 0) {
        paidVsOrganic = {
          paid: Math.round((totalPaidImpressions / totalImpressions) * 100),
          organic: Math.round((totalOrganicImpressions / totalImpressions) * 100),
          totalPaid: totalPaidImpressions,
          totalOrganic: totalOrganicImpressions,
          available: true,
        };
      } else {
        // We have post insights but no impressions data
        paidVsOrganic = {
          paid: 0,
          organic: 100,
          totalPaid: 0,
          totalOrganic: 0,
          available: true,
          message: "No paid impressions detected in this period",
        };
      }
    } else {
      // No post insights available - NOT because of ad account
      paidVsOrganic = {
        available: false,
        reason: "Post-level impression data not available from Facebook API for this page.",
      };
    }
    dataAvailability.paidVsOrganic = paidVsOrganic?.available || false;

    // Sort posts by engagement to find top/needs-work
    const sortedPosts = [...posts].map((p: any) => {
      const pInsight = postInsights[p.id] || {};
      const engagement = (p.likes?.summary?.total_count || 0) + 
                         (p.comments?.summary?.total_count || 0) + 
                         (p.shares?.count || 0);
      return {
        id: p.id,
        type: p.type,
        created_time: p.created_time,
        message: p.message,
        permalink_url: p.permalink_url,
        full_picture: p.full_picture,
        media_type: p.type || 'status',
        likes: p.likes?.summary?.total_count || 0,
        comments: p.comments?.summary?.total_count || 0,
        shares: p.shares?.count || 0,
        engagement,
        impressions: pInsight.post_impressions || null,
        impressions_organic: pInsight.post_impressions_organic || null,
        impressions_paid: pInsight.post_impressions_paid || null,
        engaged_users: pInsight.post_engaged_users || null,
        clicks: pInsight.post_clicks || null,
        is_paid: (pInsight.post_impressions_paid || 0) > 0,
        engagement_rate: pInsight.post_impressions 
          ? Math.round((engagement / pInsight.post_impressions) * 10000) / 100 
          : null,
      };
    }).sort((a, b) => b.engagement - a.engagement);

    const topPosts = sortedPosts.slice(0, 5);
    const needsWorkPosts = sortedPosts.slice(-5).reverse();

    // Post type analysis
    const postTypeStats: Record<string, { total: number; count: number }> = {};
    posts.forEach((p: any) => {
      const type = p.type || 'status';
      if (!postTypeStats[type]) {
        postTypeStats[type] = { total: 0, count: 0 };
      }
      const eng = (p.likes?.summary?.total_count || 0) + 
                  (p.comments?.summary?.total_count || 0) + 
                  (p.shares?.count || 0);
      postTypeStats[type].total += eng;
      postTypeStats[type].count += 1;
    });
    const postTypeAnalysis = Object.entries(postTypeStats).map(([type, stats]) => ({
      type,
      avgEngagement: Math.round(stats.total / stats.count),
      count: stats.count,
    }));

    // Best Time to Post heatmap computation
    const heatmapSlots: Record<string, { totalEngagement: number; count: number }> = {};
    posts.forEach((p: any) => {
      const d = new Date(p.created_time);
      const day = d.getUTCDay(); // 0=Sun, 6=Sat
      const hour = d.getUTCHours();
      const key = `${day}-${hour}`;
      const eng = (p.likes?.summary?.total_count || 0) +
                  (p.comments?.summary?.total_count || 0) +
                  (p.shares?.count || 0);
      if (!heatmapSlots[key]) heatmapSlots[key] = { totalEngagement: 0, count: 0 };
      heatmapSlots[key].totalEngagement += eng;
      heatmapSlots[key].count += 1;
    });
    const bestTimeToPost = Object.entries(heatmapSlots).map(([key, slot]) => {
      const [day, hour] = key.split('-').map(Number);
      return { day, hour, value: Math.round(slot.totalEngagement / slot.count) };
    });
    logStep("Best time to post computed", { slots: bestTimeToPost.length });

    // Store detailed metrics for ALL users (basic for free, full for Pro)
    const computedMetricsBase = {
      ...metrics,
      requestedRange: {
        ...requestedRange,
        appliedDates: dateParams,
      },
      paidVsOrganic,
      postTypeAnalysis,
      bestTimeToPost,
      trendData,
      postsAnalysis: {
        top: topPosts,
        needsWork: needsWorkPosts,
        totalCount: posts.length,
      },
      benchmarks: {
        postingFrequency: {
          current: postsPerWeek,
          target: 4,
          unit: 'posts/week',
        },
        engagementRate: {
          current: metrics.engagementRate,
          min: 1,
          max: 3,
        },
      },
    };

    await supabase.from("audit_metrics").insert({
      audit_id: audit.id,
      // Pro users get full raw_metrics (posts, insights); free users get null
      raw_metrics: hasProAccess ? {
        pageInfo,
        insights,
        posts: sortedPosts,
      } : null,
      computed_metrics: computedMetricsBase,
      data_availability: dataAvailability,
      demographics: hasProAccess ? demographics : null,
    });
    logStep("Metrics stored for all users", { 
      hasProAccess,
      dateRange: dateParams,
      hasTrendData,
      topPostsCount: topPosts.length,
      needsWorkCount: needsWorkPosts.length
    });

    // Create report record
    await supabase.from("reports").insert({
      audit_id: audit.id,
      is_public: false,
    });

    return new Response(
      JSON.stringify({
        success: true,
        audit_id: audit.id,
        scores,
        is_pro: isPro,
        date_range_applied: dateParams,
        posts_fetched: posts.length,
        has_trend_data: hasTrendData,
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
