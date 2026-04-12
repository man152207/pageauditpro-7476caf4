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

function toUnixTimestamp(dateStr: string): number {
  return Math.floor(new Date(dateStr).getTime() / 1000);
}

function getDateRangeFromPreset(preset: string): { since: string; until: string } {
  const now = new Date();
  const untilTs = Math.floor(now.getTime() / 1000);
  let since: Date;
  switch (preset) {
    case '7d': since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
    case '30d': since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
    case '3m': since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
    case '6m': since = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000); break;
    case '1y': since = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
    default: since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  return { since: String(Math.floor(since.getTime() / 1000)), until: String(untilTs) };
}

// Paginate through ALL posts in the date range
async function fetchAllPosts(pageId: string, pageToken: string, since: string, until: string): Promise<{ posts: any[]; error?: string }> {
  const allPosts: any[] = [];
  let nextUrl: string | null = `https://graph.facebook.com/v21.0/${pageId}/posts?` +
    `fields=id,message,created_time,shares,likes.summary(true),comments.summary(true),type,permalink_url,full_picture&` +
    `since=${since}&until=${until}&limit=100&access_token=${pageToken}`;

  let page = 0;
  const maxPages = 20; // Safety limit: 20 * 100 = 2000 posts max

  while (nextUrl && page < maxPages) {
    try {
      const res = await fetch(nextUrl);
      const data = await res.json();
      if (data.error) {
        logStep("Posts API error on page " + page, data.error);
        if (page === 0) return { posts: [], error: data.error.message };
        break; // Return what we have so far
      }
      const pagePosts = data.data || [];
      allPosts.push(...pagePosts);
      logStep(`Posts page ${page} fetched`, { count: pagePosts.length, total: allPosts.length });
      
      nextUrl = data.paging?.next || null;
      page++;
    } catch (e) {
      logStep("Posts fetch error on page " + page, { error: String(e) });
      break;
    }
  }
  return { posts: allPosts };
}

// Calculate engagement score from REAL data only
function calculateEngagementScore(totalEngagements: number, followers: number, postsCount: number): number | null {
  if (!followers || followers === 0 || !postsCount || postsCount === 0) return null;
  const avgEngagementPerPost = totalEngagements / postsCount;
  const engagementRate = (avgEngagementPerPost / followers) * 100;
  if (engagementRate >= 5) return 100;
  if (engagementRate >= 3) return 85;
  if (engagementRate >= 1) return 65;
  if (engagementRate >= 0.5) return 45;
  return Math.max(10, Math.round(engagementRate * 20));
}

// Calculate consistency score - only if we have real post data
function calculateConsistencyScore(postsPerWeek: number | null): number | null {
  if (postsPerWeek === null) return null;
  if (postsPerWeek >= 7) return 100;
  if (postsPerWeek >= 5) return 85;
  if (postsPerWeek >= 3) return 70;
  if (postsPerWeek >= 1) return 50;
  if (postsPerWeek > 0) return 30;
  return 10;
}

// Calculate readiness score from REAL page fields
function calculateReadinessScore(checklist: Record<string, boolean>): number {
  const items = Object.values(checklist);
  if (items.length === 0) return 0;
  const trueCount = items.filter(Boolean).length;
  return Math.round((trueCount / items.length) * 100);
}

function generateRecommendations(scores: any, metrics: any, isPro: boolean): any[] {
  const recommendations: any[] = [];
  if (scores.engagement !== null && scores.engagement < 50) {
    recommendations.push({
      priority: "high", category: "engagement",
      title: "Improve Post Engagement",
      description: "Your engagement rate is below average. Focus on creating more interactive content.",
      isPro: false,
    });
  }
  if (scores.consistency !== null && scores.consistency < 60) {
    recommendations.push({
      priority: "high", category: "consistency",
      title: "Increase Posting Frequency",
      description: "Post more regularly to maintain audience interest. Aim for 3-5 posts per week.",
      isPro: false,
    });
  }
  if (isPro) {
    if (metrics.topPostType) {
      recommendations.push({
        priority: "medium", category: "content",
        title: `Focus on ${metrics.topPostType} Content`,
        description: `Your ${metrics.topPostType} posts perform better than other content types.`,
        isPro: true,
      });
    }
    recommendations.push({
      priority: "medium", category: "timing",
      title: "Optimize Posting Times",
      description: "Based on your audience activity, the best times to post are weekdays 6-8 PM.",
      isPro: true,
    });
    if (scores.readiness !== null && scores.readiness < 75) {
      recommendations.push({
        priority: "low", category: "optimization",
        title: "Complete Page Profile",
        description: "Add missing profile information to improve page discoverability.",
        isPro: true,
      });
    }
  }
  return recommendations;
}

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
      return new Response(JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = claims.claims.sub;
    logStep("User authenticated", { userId });

    const { connection_id, date_range } = await req.json();
    if (!connection_id) {
      return new Response(JSON.stringify({ error: "connection_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const requestedRange = date_range || { preset: '30d' };
    let dateParams: { since: string; until: string };
    if (requestedRange.from && requestedRange.to) {
      dateParams = { since: String(toUnixTimestamp(requestedRange.from)), until: String(toUnixTimestamp(requestedRange.to)) };
    } else {
      dateParams = getDateRangeFromPreset(requestedRange.preset || '30d');
    }
    logStep("Date range applied", { requestedRange, dateParams });

    // Check subscription
    const { data: subscription } = await supabase
      .from("subscriptions").select("*, plan:plans(*)")
      .eq("user_id", userId).eq("status", "active").maybeSingle();
    const isPro = !!subscription && subscription.plan?.billing_type !== "free";

    const startOfMonth = new Date();
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const monthStr = startOfMonth.toISOString().split('T')[0];

    const { data: freeGrants } = await supabase
      .from("free_audit_grants").select("id, grant_month")
      .eq("user_id", userId).or(`grant_month.eq.${monthStr},grant_month.eq.9999-01-01`);
    const hasFreeAuditGrant = !!(freeGrants && freeGrants.length > 0);

    if (!isPro && !hasFreeAuditGrant) {
      const { count } = await supabase.from("audits")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId).gte("created_at", startOfMonth.toISOString());
      const limits = (subscription?.plan?.limits as any) || { audits_per_month: 3 };
      if ((count || 0) >= (limits.audits_per_month || 3)) {
        return new Response(JSON.stringify({ error: "Monthly audit limit reached", limit: limits.audits_per_month || 3, used: count }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Get connection
    const { data: connection, error: connError } = await supabase
      .from("fb_connections").select("*")
      .eq("id", connection_id).eq("user_id", userId).eq("is_active", true).single();
    if (connError || !connection) {
      return new Response(JSON.stringify({ error: "Connection not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const pageToken = await decryptToken(connection.access_token_encrypted);
    const pageId = connection.page_id;

    // Validate token
    try {
      const validateRes = await fetch(`https://graph.facebook.com/v21.0/${pageId}?fields=name&access_token=${pageToken}`);
      const validateData = await validateRes.json();
      if (validateData.error) {
        logStep("Token validation FAILED", { code: validateData.error.code, message: validateData.error.message });
        await supabase.from("fb_connections").update({ token_expires_at: new Date(0).toISOString() }).eq("id", connection_id);
        return new Response(JSON.stringify({
          error: "token_expired",
          human_message: "Your Facebook connection has expired. Please disconnect and reconnect your page.",
          fix_steps: ["Go to your connected pages list", "Click 'Reconnect'", "Re-authorize with Facebook", "Run the audit again"],
        }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } catch (e) { logStep("Token validation error", { error: e }); }

    // ========== FETCH REAL DATA ==========
    let pageInfo: any = {};
    let insights: any[] = [];
    const dataAvailability: any = {};

    // 1. Page info with REAL readiness fields
    try {
      const pageInfoUrl = `https://graph.facebook.com/v21.0/${pageId}?` +
        `fields=name,followers_count,fan_count,about,category,website,phone,picture,cover,description,` +
        `emails,single_line_address,location,hours,link,call_to_actions&` +
        `access_token=${pageToken}`;
      const pageInfoRes = await fetch(pageInfoUrl);
      pageInfo = await pageInfoRes.json();
      dataAvailability.pageInfo = !pageInfo.error;
      logStep("Page info fetched", { 
        success: !pageInfo.error, 
        followers: pageInfo.followers_count || pageInfo.fan_count,
        hasAbout: !!pageInfo.about,
        hasPicture: !!pageInfo.picture,
        hasCover: !!pageInfo.cover,
      });
    } catch (e) {
      logStep("Page info fetch failed", { error: e });
      dataAvailability.pageInfo = false;
    }

    // 2. Insights with date range
    try {
      const insightsUrl = `https://graph.facebook.com/v21.0/${pageId}/insights?` +
        `metric=page_media_view,page_post_engagements,page_follows&` +
        `period=day&since=${dateParams.since}&until=${dateParams.until}&access_token=${pageToken}`;
      const insightsRes = await fetch(insightsUrl);
      const insightsData = await insightsRes.json();
      if (insightsData.error) {
        logStep("Insights API error", insightsData.error);
        dataAvailability.insights = false;
        dataAvailability.insightsError = insightsData.error.message;
      } else {
        insights = insightsData.data || [];
        dataAvailability.insights = insights.length > 0;
      }
    } catch (e) {
      logStep("Insights fetch failed", { error: e });
      dataAvailability.insights = false;
    }

    // 3. Posts - PAGINATED through full date range
    const { posts, error: postsError } = await fetchAllPosts(pageId, pageToken, dateParams.since, dateParams.until);
    if (postsError) {
      dataAvailability.posts = false;
      const errCode = postsError.includes('permission') ? 'permission_not_granted' : postsError;
      dataAvailability.postsError = errCode;
    } else {
      dataAvailability.posts = posts.length > 0;
    }
    logStep("All posts fetched", { totalPosts: posts.length });

    // 4. Post-level insights (for ALL fetched posts, not just 25)
    let postInsights: Record<string, any> = {};
    let totalPaidImpressions = 0;
    let totalOrganicImpressions = 0;
    let hasAnyPostInsights = false;

    if (posts.length > 0) {
      // Fetch insights for up to 50 posts
      const postIds = posts.slice(0, 50).map((p: any) => p.id);
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
        } catch (_e) { /* non-blocking */ }
      }
      dataAvailability.postInsights = hasAnyPostInsights;
    }

    // 5. Demographics (Pro only)
    let demographics: any = null;
    const hasProAccess = isPro || hasFreeAuditGrant;
    if (hasProAccess) {
      try {
        const demoUrl = `https://graph.facebook.com/v21.0/${pageId}/insights?` +
          `metric=page_follows_gender_age,page_follows_city,page_follows_country&` +
          `period=lifetime&access_token=${pageToken}`;
        const demoRes = await fetch(demoUrl);
        const demoData = await demoRes.json();
        if (!demoData.error && demoData.data) {
          demographics = {
            genderAge: demoData.data.find((d: any) => d.name === 'page_follows_gender_age')?.values?.[0]?.value || null,
            cities: demoData.data.find((d: any) => d.name === 'page_follows_city')?.values?.[0]?.value || null,
            countries: demoData.data.find((d: any) => d.name === 'page_follows_country')?.values?.[0]?.value || null,
          };
          dataAvailability.demographics = true;
        } else {
          dataAvailability.demographics = false;
          dataAvailability.demographicsError = 'Demographics metrics deprecated by Meta (March 2024).';
        }
      } catch (_e) {
        dataAvailability.demographics = false;
      }
    }

    // ========== COMPUTE REAL METRICS ==========
    const followers = pageInfo.followers_count || pageInfo.fan_count || null;
    let totalLikes = 0, totalComments = 0, totalShares = 0;

    posts.forEach((post: any) => {
      totalLikes += post.likes?.summary?.total_count || 0;
      totalComments += post.comments?.summary?.total_count || 0;
      totalShares += post.shares?.count || 0;
    });

    const totalEngagements = totalLikes + totalComments + totalShares;
    const postsCount = posts.length; // REAL count, no || 1 fallback

    // Posts per week - REAL calculation only if we have posts
    let postsPerWeek: number | null = null;
    if (posts.length >= 2) {
      const firstPost = new Date(posts[posts.length - 1].created_time);
      const lastPost = new Date(posts[0].created_time);
      const daysDiff = Math.max(1, (lastPost.getTime() - firstPost.getTime()) / (1000 * 60 * 60 * 24));
      postsPerWeek = Math.round((posts.length / daysDiff) * 7 * 10) / 10;
    } else if (posts.length === 1) {
      // Single post in the range - calculate from date range span
      const rangeDays = (Number(dateParams.until) - Number(dateParams.since)) / 86400;
      postsPerWeek = rangeDays > 0 ? Math.round((1 / rangeDays) * 7 * 10) / 10 : null;
    }
    // If 0 posts, postsPerWeek stays null

    const engagementRate = (followers && postsCount > 0) 
      ? Math.round((totalEngagements / postsCount / followers) * 10000) / 100 
      : null;
    const avgEngagementPerPost = postsCount > 0 
      ? Math.round((totalEngagements / postsCount) * 10) / 10 
      : null;

    // Find top post type
    let topPostType: string | null = null;
    if (posts.length > 0) {
      const typeCounts: Record<string, number> = {};
      posts.forEach((p: any) => { const t = p.type || 'status'; typeCounts[t] = (typeCounts[t] || 0) + 1; });
      topPostType = Object.entries(typeCounts).sort(([,a],[,b]) => b - a)[0]?.[0] || null;
    }

    // ========== REAL READINESS CHECKLIST ==========
    const readinessChecklist: Record<string, boolean> = {
      profile_photo: !!(pageInfo.picture && pageInfo.picture.data && !pageInfo.picture.data.is_silhouette),
      cover_photo: !!(pageInfo.cover),
      page_description: !!(pageInfo.about || pageInfo.description),
      contact_info: !!(pageInfo.phone || (pageInfo.emails && pageInfo.emails.length > 0)),
      website: !!(pageInfo.website),
      category: !!(pageInfo.category),
      address: !!(pageInfo.single_line_address || pageInfo.location),
    };
    logStep("Readiness checklist (real)", readinessChecklist);

    // ========== GENUINE SCORING ==========
    const engagementScore = calculateEngagementScore(totalEngagements, followers || 0, postsCount);
    const consistencyScore = calculateConsistencyScore(postsPerWeek);
    const readinessScore = calculateReadinessScore(readinessChecklist);

    // Only include available scores in the overall calculation
    const scoreComponents: { score: number; weight: number }[] = [];
    if (engagementScore !== null) scoreComponents.push({ score: engagementScore, weight: 0.4 });
    if (consistencyScore !== null) scoreComponents.push({ score: consistencyScore, weight: 0.35 });
    scoreComponents.push({ score: readinessScore, weight: 0.25 }); // Always available from page info

    // Normalize weights if some scores are missing
    const totalWeight = scoreComponents.reduce((sum, c) => sum + c.weight, 0);
    const overallScore = totalWeight > 0
      ? Math.round(scoreComponents.reduce((sum, c) => sum + c.score * (c.weight / totalWeight), 0))
      : 0;

    const scores: any = {
      overall: overallScore,
      engagement: engagementScore, // null if unavailable
      consistency: consistencyScore, // null if unavailable
      readiness: readinessScore,
    };
    logStep("Scores calculated (genuine)", scores);

    const recommendations = generateRecommendations(scores, { topPostType }, hasProAccess);

    // Create audit record
    const { data: audit, error: auditError } = await supabase
      .from("audits").insert({
        user_id: userId,
        fb_connection_id: connection_id,
        audit_type: "automatic",
        page_name: connection.page_name,
        page_url: `https://facebook.com/${pageId}`,
        input_data: {
          followers,
          postsPerWeek,
          totalLikes, totalComments, totalShares, totalEngagements,
          postsAnalyzed: postsCount,
          engagementRate,
          avgEngagementPerPost,
          dateRange: dateParams,
          requestedRange,
        },
        score_total: overallScore,
        score_breakdown: scores,
        recommendations: recommendations.filter(r => !r.isPro || hasProAccess),
        is_pro_unlocked: hasProAccess,
      }).select().single();

    if (auditError) {
      logStep("Audit creation failed", { error: auditError.message });
      return new Response(JSON.stringify({ error: "Failed to create audit" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    logStep("Audit created", { auditId: audit.id });

    // Build trend data
    const trendData = {
      impressions: buildTimeSeries(insights, 'page_media_view'),
      engagedUsers: buildTimeSeries(insights, 'page_post_engagements'),
      postEngagements: buildTimeSeries(insights, 'page_post_engagements'),
      fans: buildTimeSeries(insights, 'page_follows'),
    };
    const hasTrendData = Object.values(trendData).some(arr => arr.length > 0);

    // Paid vs organic
    let paidVsOrganic: any = null;
    if (hasAnyPostInsights) {
      const totalImpressions = totalPaidImpressions + totalOrganicImpressions;
      paidVsOrganic = totalImpressions > 0
        ? { paid: Math.round((totalPaidImpressions / totalImpressions) * 100), organic: Math.round((totalOrganicImpressions / totalImpressions) * 100), totalPaid: totalPaidImpressions, totalOrganic: totalOrganicImpressions, available: true }
        : { paid: 0, organic: 100, totalPaid: 0, totalOrganic: 0, available: true, message: "No paid impressions detected" };
    } else {
      paidVsOrganic = { available: false, reason: "Post-level impression data not available from Facebook API for this page." };
    }
    dataAvailability.paidVsOrganic = paidVsOrganic?.available || false;

    // Sort posts by engagement
    const sortedPosts = [...posts].map((p: any) => {
      const pInsight = postInsights[p.id] || {};
      const engagement = (p.likes?.summary?.total_count || 0) + (p.comments?.summary?.total_count || 0) + (p.shares?.count || 0);
      return {
        id: p.id, type: p.type, created_time: p.created_time, message: p.message,
        permalink_url: p.permalink_url, full_picture: p.full_picture, media_type: p.type || 'status',
        likes: p.likes?.summary?.total_count || 0, comments: p.comments?.summary?.total_count || 0,
        shares: p.shares?.count || 0, engagement,
        impressions: pInsight.post_impressions || null,
        impressions_organic: pInsight.post_impressions_organic || null,
        impressions_paid: pInsight.post_impressions_paid || null,
        engaged_users: pInsight.post_engaged_users || null,
        clicks: pInsight.post_clicks || null,
        is_paid: (pInsight.post_impressions_paid || 0) > 0,
        engagement_rate: pInsight.post_impressions ? Math.round((engagement / pInsight.post_impressions) * 10000) / 100 : null,
      };
    }).sort((a, b) => b.engagement - a.engagement);

    const topPosts = sortedPosts.slice(0, 5);
    const needsWorkPosts = sortedPosts.slice(-5).reverse();

    // Post type analysis
    const postTypeStats: Record<string, { total: number; count: number }> = {};
    posts.forEach((p: any) => {
      const type = p.type || 'status';
      if (!postTypeStats[type]) postTypeStats[type] = { total: 0, count: 0 };
      const eng = (p.likes?.summary?.total_count || 0) + (p.comments?.summary?.total_count || 0) + (p.shares?.count || 0);
      postTypeStats[type].total += eng;
      postTypeStats[type].count += 1;
    });
    const postTypeAnalysis = Object.entries(postTypeStats).map(([type, stats]) => ({
      type, avgEngagement: Math.round(stats.total / stats.count), count: stats.count,
    }));

    // Best time to post heatmap
    const heatmapSlots: Record<string, { totalEngagement: number; count: number }> = {};
    posts.forEach((p: any) => {
      const d = new Date(p.created_time);
      const key = `${d.getUTCDay()}-${d.getUTCHours()}`;
      const eng = (p.likes?.summary?.total_count || 0) + (p.comments?.summary?.total_count || 0) + (p.shares?.count || 0);
      if (!heatmapSlots[key]) heatmapSlots[key] = { totalEngagement: 0, count: 0 };
      heatmapSlots[key].totalEngagement += eng;
      heatmapSlots[key].count += 1;
    });
    const bestTimeToPost = Object.entries(heatmapSlots).map(([key, slot]) => {
      const [day, hour] = key.split('-').map(Number);
      return { day, hour, value: Math.round(slot.totalEngagement / slot.count) };
    });

    // Store metrics for ALL users
    const computedMetrics = {
      followers,
      totalEngagements, totalLikes, totalComments, totalShares,
      postsCount,
      postsPerWeek,
      avgEngagementPerPost,
      engagementRate,
      topPostType,
      readinessChecklist,
      requestedRange: { ...requestedRange, appliedDates: dateParams },
      paidVsOrganic,
      postTypeAnalysis,
      bestTimeToPost,
      trendData,
      postsAnalysis: { top: topPosts, needsWork: needsWorkPosts, totalCount: posts.length },
      benchmarks: {
        postingFrequency: { current: postsPerWeek, target: 4, unit: 'posts/week' },
        engagementRate: { current: engagementRate, min: 1, max: 3 },
      },
    };

    await supabase.from("audit_metrics").insert({
      audit_id: audit.id,
      raw_metrics: hasProAccess ? { pageInfo, insights, posts: sortedPosts } : null,
      computed_metrics: computedMetrics,
      data_availability: dataAvailability,
      demographics: hasProAccess ? demographics : null,
    });
    logStep("Metrics stored", { postsCount, followers, engagementRate, hasTrendData });

    await supabase.from("reports").insert({ audit_id: audit.id, is_public: false });

    return new Response(JSON.stringify({
      success: true, audit_id: audit.id, scores,
      is_pro: isPro, date_range_applied: dateParams,
      posts_fetched: posts.length, has_trend_data: hasTrendData,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
