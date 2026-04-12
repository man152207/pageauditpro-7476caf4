import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ExternalLink,
  FileImage,
  Video,
  Link as LinkIcon,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  ThumbsUp,
  MessageCircle,
  Share2,
  Eye,
  DollarSign,
  Leaf,
  ImageIcon,
  PlayCircle,
} from 'lucide-react';
import { format } from 'date-fns';

interface Post {
  id?: string;
  type?: string;
  created_time?: string;
  message?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  reach?: number;
  impressions?: number;
  engagement_rate?: number;
  permalink_url?: string;
  full_picture?: string;
  media_type?: string;
  is_paid?: boolean;
  paid_impressions?: number;
  organic_impressions?: number;
}

interface PostsTabViewProps {
  posts: Post[];
  isLoading?: boolean;
  className?: string;
}

const postTypeIcons: Record<string, React.ElementType> = {
  photo: FileImage,
  video: Video,
  link: LinkIcon,
  status: MessageSquare,
  default: MessageSquare,
};

function getPostTypeIcon(type?: string) {
  const normalizedType = type?.toLowerCase() || 'default';
  return postTypeIcons[normalizedType] || postTypeIcons.default;
}

function generateWhyItWorked(post: Post, isTop: boolean): string {
  const engagement = (post.likes || 0) + (post.comments || 0) + (post.shares || 0);
  const hints: string[] = [];

  // Check if we have enough metrics to infer why
  const hasMetrics = post.likes !== undefined || post.comments !== undefined || post.shares !== undefined;
  
  if (!hasMetrics || engagement === 0) {
    return 'Not enough data to infer why';
  }

  if (isTop) {
    if (engagement > 100) hints.push('High engagement above average');
    if (post.type?.toLowerCase() === 'video') hints.push('Video content drives 2x more engagement');
    if (post.type?.toLowerCase() === 'photo') hints.push('Visual content captures attention');
    if ((post.shares || 0) > (post.likes || 0) * 0.1) hints.push('Strong share rate indicates value');
    if ((post.comments || 0) > (post.likes || 0) * 0.05) hints.push('Good conversation starter');
  } else {
    if (engagement < 20) hints.push('Low engagement - consider different content type');
    if (post.type?.toLowerCase() === 'status') hints.push('Text-only posts often underperform');
    if ((post.shares || 0) === 0) hints.push('No shares - content may lack shareability');
    if (!post.message || post.message.length < 20) hints.push('Short/missing caption limits context');
  }

  return hints.length > 0 ? hints[0] : 'Not enough data to infer why';
}

function PostRow({ post, rank, isTop }: { post: Post; rank: number; isTop: boolean }) {
  const Icon = getPostTypeIcon(post.type);
  const engagement = (post.likes || 0) + (post.comments || 0) + (post.shares || 0);
  const postDate = post.created_time ? new Date(post.created_time) : null;
  const whyText = generateWhyItWorked(post, isTop);
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-border hover:border-primary/20 hover:bg-muted/30 transition-all group">
      {/* Rank */}
      <div className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold shrink-0',
        isTop ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
      )}>
        #{rank}
      </div>

      {/* Thumbnail */}
      {post.full_picture ? (
        <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted">
          <img 
            src={post.full_picture} 
            alt="Post thumbnail"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {post.type?.toLowerCase() === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <PlayCircle className="h-6 w-6 text-white" />
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted shrink-0">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-medium line-clamp-2">
            {post.message?.substring(0, 80) || `${post.type || 'Post'}`}
            {post.message && post.message.length > 80 && '...'}
          </p>
          {post.permalink_url ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <a 
                  href={post.permalink_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  aria-label="View post on Facebook"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </TooltipTrigger>
              <TooltipContent>View on Facebook</TooltipContent>
            </Tooltip>
          ) : (
            <span className="shrink-0 p-1.5 rounded-lg bg-muted text-muted-foreground" title="No link available">
              <ExternalLink className="h-4 w-4 opacity-30" />
            </span>
          )}
        </div>

        {/* Date & Type */}
        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
          {postDate && <span>{format(postDate, 'MMM d, yyyy • h:mm a')}</span>}
          <Badge variant="outline" className="text-xs capitalize">{post.type || 'post'}</Badge>
          {post.is_paid && (
            <Badge className="bg-warning/10 text-warning text-xs">
              <DollarSign className="h-3 w-3 mr-0.5" />
              Paid
            </Badge>
          )}
        </div>

        {/* Metrics Row */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <ThumbsUp className="h-3 w-3" />
            <span>{(post.likes || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MessageCircle className="h-3 w-3" />
            <span>{(post.comments || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Share2 className="h-3 w-3" />
            <span>{(post.shares || 0).toLocaleString()}</span>
          </div>
          {(post.reach || post.impressions) && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="h-3 w-3" />
              <span>{(post.reach || post.impressions || 0).toLocaleString()}</span>
            </div>
          )}
          {post.engagement_rate != null && (
            <Badge variant="secondary" className="text-xs">
              {post.engagement_rate.toFixed(2)}% ER
            </Badge>
          )}
        </div>

        {/* Why it worked/failed */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              'mt-2 flex items-center gap-1.5 text-xs cursor-help',
              isTop ? 'text-success' : 'text-destructive'
            )}>
              {isTop ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{isTop ? 'Why it worked' : 'Why it underperformed'}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs">{whyText}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export function PostsTabView({ posts, isLoading, className }: PostsTabViewProps) {
  const [activeTab, setActiveTab] = useState<'top' | 'needs-work'>('top');

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3 p-3 border border-border rounded-xl">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-16 w-16 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className={cn('rounded-xl border border-border p-8 text-center', className)}>
        <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">No posts available for analysis.</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Try a longer date range or run another audit later.
        </p>
      </div>
    );
  }

  // Sort posts by engagement
  const sortedPosts = [...posts].sort((a, b) => {
    const engA = (a.likes || 0) + (a.comments || 0) + (a.shares || 0);
    const engB = (b.likes || 0) + (b.comments || 0) + (b.shares || 0);
    return engB - engA;
  });

  const topPosts = sortedPosts.slice(0, 5);
  const bottomPosts = sortedPosts.slice(-5).reverse();

  return (
    <div className={cn('space-y-4', className)}>
      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-muted/50 rounded-xl w-fit">
        <Button
          variant={activeTab === 'top' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('top')}
          className={cn(
            'rounded-lg transition-all',
            activeTab === 'top' && 'shadow-sm'
          )}
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Top Posts
          <Badge variant="secondary" className="ml-2 text-xs">{topPosts.length}</Badge>
        </Button>
        <Button
          variant={activeTab === 'needs-work' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('needs-work')}
          className={cn(
            'rounded-lg transition-all',
            activeTab === 'needs-work' && 'shadow-sm'
          )}
        >
          <TrendingDown className="mr-2 h-4 w-4" />
          Needs Work
          <Badge variant="secondary" className="ml-2 text-xs">{bottomPosts.length}</Badge>
        </Button>
      </div>

      {/* Post List */}
      <div className="space-y-3">
        {(activeTab === 'top' ? topPosts : bottomPosts).map((post, index) => (
          <PostRow 
            key={post.id || index} 
            post={post} 
            rank={index + 1}
            isTop={activeTab === 'top'}
          />
        ))}
      </div>
    </div>
  );
}
