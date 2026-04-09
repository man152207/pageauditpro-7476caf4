import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface ScheduledPost {
  id: string;
  user_id: string;
  fb_connection_id: string | null;
  content: string;
  media_urls: string[];
  scheduled_at: string | null;
  status: "draft" | "scheduled" | "published" | "failed";
  published_at: string | null;
  platform: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  fb_connections?: { page_name: string } | null;
}

export function useScheduledPosts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const postsQuery = useQuery({
    queryKey: ["scheduled-posts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_posts")
        .select("*, fb_connections(page_name)")
        .eq("user_id", user!.id)
        .order("scheduled_at", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data || []) as ScheduledPost[];
    },
    enabled: !!user,
  });

  const createPost = useMutation({
    mutationFn: async (post: {
      content: string;
      fb_connection_id?: string;
      scheduled_at?: string;
      status?: string;
      media_urls?: string[];
      platform?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("schedule-post", {
        body: { action: "create", ...post },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.post as ScheduledPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      toast({ title: "Post created successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updatePost = useMutation({
    mutationFn: async (post: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase.functions.invoke("schedule-post", {
        body: { action: "update", ...post },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.post as ScheduledPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      toast({ title: "Post updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke("schedule-post", {
        body: { action: "delete", id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      toast({ title: "Post deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return {
    posts: postsQuery.data || [],
    isLoading: postsQuery.isLoading,
    error: postsQuery.error,
    createPost,
    updatePost,
    deletePost,
    refetch: postsQuery.refetch,
  };
}
