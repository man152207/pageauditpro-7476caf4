import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus, List, CalendarDays, Loader2, Users, Check, ChevronsUpDown } from "lucide-react";
import { CalendarGrid } from "@/components/planner/CalendarGrid";
import { PostComposer } from "@/components/planner/PostComposer";
import { PostCard } from "@/components/planner/PostCard";
import { useScheduledPosts, type ScheduledPost } from "@/hooks/useScheduledPosts";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface FBConnection {
  id: string;
  page_name: string;
  user_id?: string;
}

interface UserOption {
  id: string;
  email: string | null;
  full_name: string | null;
}

export default function ContentPlannerPage() {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const canManageOthers = isAdmin || isSuperAdmin;
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [autoPublish, setAutoPublish] = useState(true);
  const { posts, isLoading, createPost, updatePost, deletePost } = useScheduledPosts(
    canManageOthers ? selectedUserId : undefined
  );
  const { isPro } = useSubscription();
  const [connections, setConnections] = useState<FBConnection[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [editPost, setEditPost] = useState<ScheduledPost | null>(null);
  const [view, setView] = useState<"calendar" | "list">("calendar");

  // Fetch users list for admins
  useEffect(() => {
    if (!canManageOthers) return;
    supabase
      .from("profiles")
      .select("user_id, email, full_name")
      .eq("is_active", true)
      .order("full_name")
      .then(({ data }) => {
        if (data) setUsers(data.map((p) => ({ id: p.user_id, email: p.email, full_name: p.full_name })));
      });
  }, [canManageOthers]);

  // Fetch FB connections based on selected user (or own)
  useEffect(() => {
    const uid = canManageOthers && selectedUserId ? selectedUserId : user?.id;
    if (!uid) return;
    supabase
      .from("fb_connections")
      .select("id, page_name")
      .eq("user_id", uid)
      .eq("is_active", true)
      .then(({ data }) => {
        if (data) setConnections(data);
        else setConnections([]);
      });
  }, [user, selectedUserId, canManageOthers]);

  const selectedUserLabel = useMemo(() => {
    if (!selectedUserId) return "My Posts";
    const u = users.find((u) => u.id === selectedUserId);
    return u ? u.full_name || u.email || u.id.slice(0, 8) : "Select user";
  }, [selectedUserId, users]);

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

  const handleDeletePost = (id: string) => {
    deletePost.mutate(id);
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

      {/* Admin: User selector + Auto-publish toggle */}
      {canManageOthers && (
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Searchable user combobox */}
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium whitespace-nowrap">Manage posts for:</Label>
                <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={userSearchOpen}
                      className="w-[250px] justify-between font-normal"
                    >
                      <span className="truncate">{selectedUserLabel}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0">
                    <Command>
                      <CommandInput placeholder="Search users..." />
                      <CommandList>
                        <CommandEmpty>No user found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="my-posts"
                            onSelect={() => {
                              setSelectedUserId(undefined);
                              setUserSearchOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", !selectedUserId ? "opacity-100" : "opacity-0")} />
                            My Posts
                          </CommandItem>
                          {users.map((u) => (
                            <CommandItem
                              key={u.id}
                              value={`${u.full_name || ""} ${u.email || ""}`}
                              onSelect={() => {
                                setSelectedUserId(u.id);
                                setUserSearchOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", selectedUserId === u.id ? "opacity-100" : "opacity-0")} />
                              <div className="flex flex-col">
                                <span className="text-sm">{u.full_name || "Unnamed"}</span>
                                {u.email && <span className="text-xs text-muted-foreground">{u.email}</span>}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Auto-publish toggle */}
              <div className="flex items-center gap-2 ml-auto">
                <Label htmlFor="auto-publish" className="text-sm font-medium cursor-pointer">
                  Auto-publish
                </Label>
                <Switch
                  id="auto-publish"
                  checked={autoPublish}
                  onCheckedChange={setAutoPublish}
                />
                <span className="text-xs text-muted-foreground">
                  {autoPublish ? "Posts will be published automatically" : "Plan only — no auto-publish"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isPro && !canManageOthers && (
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
            onDeletePost={handleDeletePost}
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
        autoPublish={autoPublish}
      />
    </div>
  );
}
