import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ScheduledPost } from "@/hooks/useScheduledPosts";

const statusConfig = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  published: { label: "Published", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  failed: { label: "Failed", className: "bg-destructive/10 text-destructive" },
};

interface PostCardProps {
  post: ScheduledPost;
  onClick?: () => void;
  compact?: boolean;
}

export function PostCard({ post, onClick, compact }: PostCardProps) {
  const config = statusConfig[post.status] || statusConfig.draft;

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left text-xs px-1.5 py-0.5 rounded truncate border-l-2",
          post.status === "draft" && "border-l-muted-foreground bg-muted/50",
          post.status === "scheduled" && "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20",
          post.status === "published" && "border-l-green-500 bg-green-50 dark:bg-green-950/20",
          post.status === "failed" && "border-l-destructive bg-destructive/5"
        )}
      >
        {post.content.slice(0, 30) || "Untitled"}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors space-y-1.5"
    >
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className={cn("text-[10px]", config.className)}>
          {config.label}
        </Badge>
        {post.fb_connections?.page_name && (
          <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
            {post.fb_connections.page_name}
          </span>
        )}
      </div>
      <p className="text-sm line-clamp-2">{post.content || "No content yet"}</p>
      {post.scheduled_at && (
        <p className="text-[10px] text-muted-foreground">
          {new Date(post.scheduled_at).toLocaleString()}
        </p>
      )}
      {post.error_message && (
        <p className="text-[10px] text-destructive truncate">{post.error_message}</p>
      )}
    </button>
  );
}
