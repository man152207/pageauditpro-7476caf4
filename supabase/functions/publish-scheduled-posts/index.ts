import { createClient } from "npm:@supabase/supabase-js@2";
import { decryptToken } from "../_shared/token-encryption.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("[publish-scheduled-posts] Checking for due posts...");

    // Find all posts that are scheduled and due
    const now = new Date().toISOString();
    const { data: duePosts, error: fetchError } = await supabase
      .from("scheduled_posts")
      .select("*, fb_connections(page_id, access_token_encrypted)")
      .eq("status", "scheduled")
      .lte("scheduled_at", now);

    if (fetchError) throw fetchError;

    if (!duePosts || duePosts.length === 0) {
      console.log("[publish-scheduled-posts] No due posts found.");
      return new Response(JSON.stringify({ published: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[publish-scheduled-posts] Found ${duePosts.length} due posts.`);

    let publishedCount = 0;
    let failedCount = 0;

    for (const post of duePosts) {
      try {
        const conn = post.fb_connections;
        if (!conn?.access_token_encrypted || !conn?.page_id) {
          await supabase
            .from("scheduled_posts")
            .update({ status: "failed", error_message: "No valid Facebook connection" })
            .eq("id", post.id);
          failedCount++;
          continue;
        }

        const accessToken = await decryptToken(conn.access_token_encrypted);

        // Publish to Facebook
        const fbUrl = `https://graph.facebook.com/v21.0/${conn.page_id}/feed`;
        const fbBody: Record<string, string> = {
          message: post.content,
          access_token: accessToken,
        };

        // If there's a media URL, post as photo instead
        let fbResponse;
        if (post.media_urls && post.media_urls.length > 0) {
          const photoUrl = `https://graph.facebook.com/v21.0/${conn.page_id}/photos`;
          fbResponse = await fetch(photoUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: post.media_urls[0],
              message: post.content,
              access_token: accessToken,
            }),
          });
        } else {
          fbResponse = await fetch(fbUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fbBody),
          });
        }

        const fbData = await fbResponse.json();

        if (fbData.error) {
          console.error(`[publish-scheduled-posts] FB API error for post ${post.id}:`, fbData.error);
          await supabase
            .from("scheduled_posts")
            .update({
              status: "failed",
              error_message: fbData.error.message || "Facebook API error",
            })
            .eq("id", post.id);
          failedCount++;
        } else {
          console.log(`[publish-scheduled-posts] Published post ${post.id} -> FB ID: ${fbData.id}`);
          await supabase
            .from("scheduled_posts")
            .update({
              status: "published",
              published_at: new Date().toISOString(),
              error_message: null,
            })
            .eq("id", post.id);
          publishedCount++;
        }
      } catch (postErr) {
        console.error(`[publish-scheduled-posts] Error publishing post ${post.id}:`, postErr);
        await supabase
          .from("scheduled_posts")
          .update({
            status: "failed",
            error_message: postErr.message || "Unknown error",
          })
          .eq("id", post.id);
        failedCount++;
      }
    }

    console.log(`[publish-scheduled-posts] Done. Published: ${publishedCount}, Failed: ${failedCount}`);

    return new Response(
      JSON.stringify({ published: publishedCount, failed: failedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[publish-scheduled-posts] Fatal error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
