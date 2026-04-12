import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileImage,
  Video,
  PlayCircle,
  TrendingUp,
  ExternalLink,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Creative {
  id: string;
  type: 'photo' | 'video' | 'link';
  thumbnail_url?: string;
  engagement: number;
  engagement_rate?: number;
  permalink_url?: string;
}

interface CreativePreviewProps {
  creatives: Creative[];
  isLoading?: boolean;
  postTypeStats?: {
    type: string;
    avgEngagement: number;
    count: number;
  }[];
  className?: string;
}

export function CreativePreview({ 
  creatives, 
  isLoading,
  postTypeStats,
  className 
}: CreativePreviewProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!creatives || creatives.length === 0) {
    return (
      <div className={cn('text-center py-6', className)}>
        <FileImage className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No creative assets found</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Posts with images/videos will appear here
        </p>
      </div>
    );
  }

  // Find best performing type
  const bestType = postTypeStats?.reduce((best, current) => 
    current.avgEngagement > (best?.avgEngagement || 0) ? current : best
  , postTypeStats[0]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Creative Grid */}
      <div className="grid grid-cols-3 gap-3">
        {creatives.slice(0, 3).map((creative, index) => (
          <div 
            key={creative.id}
            className="relative aspect-square rounded-xl overflow-hidden bg-muted group cursor-pointer"
          >
            {creative.thumbnail_url ? (
              <img 
                src={creative.thumbnail_url}
                alt={`Creative ${index + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {creative.type === 'video' ? (
                  <Video className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <FileImage className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
            )}

            {/* Video overlay */}
            {creative.type === 'video' && creative.thumbnail_url && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <PlayCircle className="h-10 w-10 text-white" />
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <div className="text-white text-center">
                <p className="text-lg font-bold">{creative.engagement.toLocaleString()}</p>
                <p className="text-xs opacity-80">engagements</p>
              </div>
              {creative.permalink_url && (
                <div className="flex items-center gap-1">
                  <a 
                    href={creative.permalink_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/80 hover:text-white"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-white/60 cursor-help" onClick={(e) => e.stopPropagation()} />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px]">
                      <p className="text-xs">Facebook links may be blocked in preview mode. They work normally on the live site.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>

            {/* Rank badge */}
            <Badge className="absolute top-2 left-2 text-xs bg-success text-success-foreground">
              #{index + 1}
            </Badge>

            {/* Type badge */}
            <Badge 
              variant="secondary" 
              className="absolute bottom-2 right-2 text-xs capitalize"
            >
              {creative.type}
            </Badge>
          </div>
        ))}
      </div>

      {/* Insight */}
      {bestType && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-success/5 border border-success/20">
          <Sparkles className="h-4 w-4 text-success shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">
              <span className="capitalize">{bestType.type}</span> posts outperform others
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your {bestType.type.toLowerCase()} content gets {Math.round(bestType.avgEngagement)} avg. engagements ({bestType.count} posts analyzed)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
