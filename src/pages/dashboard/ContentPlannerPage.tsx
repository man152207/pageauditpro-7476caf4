import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus, List, CalendarDays, Loader2 } from "lucide-react";
import { CalendarGrid } from "@/components/planner/CalendarGrid";
import { PostComposer } from "@/components/planner/PostComposer";
import { PostCard } from "@/components/planner/PostCard";
import { useScheduledPosts, type ScheduledPost } from "@/hooks/useScheduledPosts";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FBConnection {
  id: string;
  page_name: string;
}

export default function ContentPlannerPage() {
  const { user } = useAuth();
  const { posts, isLoading, createPost, updatePost, deletePost } = useScheduledPosts();
  const { isPro } = useSubscription();
  const [connections, setConnections] = useState<FBConnection[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [editPost, setEditPost] = useState<ScheduledPost | null>(null);
  const [view, setView] = useState<"calendar" | "list">("calendar");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("fb_connections")
      .select("id, page_name")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .then(({ data }) => {
        if (data) setConnections(data);
      });
  }, [user]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setEditPost(null);
    setComposerOpen(true);
  };

  const handlePostClick = (post: ScheduledPost) => {
    setEditPost(post);
    setSelectedDate(undefined);
    setComposerOpen(true);
  };

  const handleSubmit = (postData: {
    content: string;
    fb_connection_id?: string;
    scheduled_at?: string;
    status: string;
    media_urls?: string[];
  }) => {
    if (editPost) {
      updatePost.mutate(
        { id: editPost.id, ...postData },
        { onSuccess: () => setComposerOpen(false) }
      );
    } else {
      createPost.mutate(postData as Parameters<typeof createPost.mutate>[0], {
        onSuccess: () => setComposerOpen(false),
      });
    }
  };

  const stats = {
    total: posts.length,
    drafts: posts.filter((p) => p.status === "draft").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    published: posts.filter((p) => p.status === "published").length,
    failed: posts.filter((p) => p.status === "failed").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Content Planner"
          description="Plan, schedule, and auto-publish posts to your Facebook pages."
        />
        <Button onClick={() => { setEditPost(null); setSelectedDate(undefined); setComposerOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> New Post
        </Button>
      </div>

      {!isPro && (
        <Alert>
          <AlertDescription>
            Free plan: {3 - stats.total > 0 ? 3 - stats.total : 0} posts remaining this month.
            Upgrade to Pro for unlimited scheduling.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, color: "" },
          { label: "Drafts", value: stats.drafts, color: "text-muted-foreground" },
          { label: "Scheduled", value: stats.scheduled, color: "text-blue-600" },
          { label: "Published", value: stats.published, color: "text-green-600" },
          { label: "Failed", value: stats.failed, color: "text-destructive" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View toggle */}
      <Tabs value={view} onValueChange={(v) => setView(v as "calendar" | "list")}>
        <TabsList>
          <TabsTrigger value="calendar" className="gap-1">
            <CalendarDays className="h-3.5 w-3.5" /> Calendar
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-1">
            <List className="h-3.5 w-3.5" /> List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <CalendarGrid
            posts={posts}
            onDateClick={handleDateClick}
            onPostClick={handlePostClick}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No posts yet. Create your first post!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onClick={() => handlePostClick(post)} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <PostComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        onSubmit={handleSubmit}
        connections={connections}
        isSubmitting={createPost.isPending || updatePost.isPending}
        initialDate={selectedDate}
        editPost={editPost}
      />
    </div>
  );
}
